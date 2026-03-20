const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

// @desc    Get dashboard stats
exports.getDashboardStats = async (req, res, next) => {
    try {
        const Quotation = require('../models/Quotation');
        const SalesOrder = require('../models/SalesOrder');
        const DeliveryNote = require('../models/DeliveryNote');
        const CreditNote = require('../models/CreditNote');
        const Customer = require('../models/Customer');
        const Expense = require('../models/Expense');
        const PurchaseOrder = require('../models/PurchaseOrder');
        const Bill = require('../models/Bill');
        const VendorCredit = require('../models/VendorCredit');

        const uf = userFilter(req);

        const [totalProducts, lowStockProducts, totalEmployees, quotations, orders, deliveries, creditNotes, payrollPending, customers, expenses, purchaseOrders, bills, vendorCredits] = await Promise.all([
            Product.countDocuments(uf),
            Product.countDocuments({ ...uf, quantity: { $lte: 10 } }),
            Employee.countDocuments({ status: 'active' }),
            Quotation.countDocuments(uf),
            SalesOrder.countDocuments(uf),
            DeliveryNote.countDocuments(uf),
            CreditNote.countDocuments(uf),
            Payroll.aggregate([{ $match: { status: { $ne: 'paid' } } }, { $group: { _id: null, total: { $sum: '$netSalary' } } }]),
            Customer.countDocuments(uf),
            Expense.aggregate([{ $match: uf }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            PurchaseOrder.countDocuments(uf),
            Bill.aggregate([{ $match: uf }, { $group: { _id: null, total: { $sum: '$total' }, unpaid: { $sum: { $subtract: ['$total', { $ifNull: ['$paidAmount', 0] }] } } } }]),
            VendorCredit.countDocuments(uf),
        ]);

        const salesAgg = await Sale.aggregate([
            { $match: uf },
            { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: '$total' } } },
        ]);

        const pendingDeliveries = await DeliveryNote.countDocuments({ ...uf, status: { $ne: 'delivered' } });
        const openOrders = await SalesOrder.countDocuments({ ...uf, status: { $in: ['draft', 'confirmed'] } });

        const stats = {
            totalSales: salesAgg[0]?.totalSales || 0,
            totalRevenue: salesAgg[0]?.totalRevenue || 0,
            totalProducts,
            lowStockProducts,
            totalEmployees,
            totalQuotations: quotations,
            totalOrders: orders,
            openOrders,
            totalDeliveries: deliveries,
            pendingDeliveries,
            totalCreditNotes: creditNotes,
            pendingPayroll: payrollPending[0]?.total || 0,
            totalCustomers: customers,
            totalExpenses: expenses[0]?.total || 0,
            totalPurchaseOrders: purchaseOrders,
            totalBills: bills[0]?.total || 0,
            unpaidBills: bills[0]?.unpaid || 0,
            totalVendorCredits: vendorCredits,
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sales report (daily/weekly/monthly)
exports.getSalesReport = async (req, res, next) => {
    try {
        const { period = 'daily', startDate, endDate } = req.query;
        const uf = userFilter(req);
        let dateFilter = { ...uf };

        if (startDate && endDate) {
            dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
            const now = new Date();
            const start = new Date();
            if (period === 'daily') start.setDate(now.getDate() - 30);
            else if (period === 'weekly') start.setDate(now.getDate() - 90);
            else if (period === 'monthly') start.setFullYear(now.getFullYear() - 1);
            dateFilter.createdAt = { $gte: start, $lte: now };
        }

        let groupFormat;
        if (period === 'daily') groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        else if (period === 'weekly') groupFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        else groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

        const report = await Sale.aggregate([
            { $match: dateFilter },
            { $group: { _id: groupFormat, totalSales: { $sum: 1 }, revenue: { $sum: '$total' }, avgOrderValue: { $avg: '$total' } } },
            { $sort: { _id: 1 } },
        ]);

        res.json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory report
exports.getInventoryReport = async (req, res, next) => {
    try {
        const products = await Product.find(userFilter(req))
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort({ quantity: 1 });

        const totalValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
        const totalCost = products.reduce((acc, p) => acc + p.cost * p.quantity, 0);

        res.json({
            success: true,
            data: {
                products,
                summary: { totalProducts: products.length, totalValue, totalCost, potentialProfit: totalValue - totalCost },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get employee report
exports.getEmployeeReport = async (req, res, next) => {
    try {
        const departmentStats = await Employee.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$department', count: { $sum: 1 }, totalSalary: { $sum: '$salary' }, avgSalary: { $avg: '$salary' } } },
            { $sort: { count: -1 } },
        ]);

        const totalEmployees = await Employee.countDocuments({ status: 'active' });
        const totalSalaryExpense = departmentStats.reduce((acc, d) => acc + d.totalSalary, 0);

        res.json({ success: true, data: { departmentStats, summary: { totalEmployees, totalSalaryExpense } } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get profit report
exports.getProfitReport = async (req, res, next) => {
    try {
        const uf = userFilter(req);
        const sales = await Sale.find(uf).populate('items.product', 'cost');

        let totalRevenue = 0;
        let totalCost = 0;

        for (const sale of sales) {
            totalRevenue += sale.total;
            for (const item of sale.items) {
                if (item.product && item.product.cost) {
                    totalCost += item.product.cost * item.quantity;
                }
            }
        }

        res.json({
            success: true,
            data: {
                totalRevenue, totalCost, grossProfit: totalRevenue - totalCost,
                profitMargin: totalRevenue > 0 ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(2) : 0,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export data as CSV
exports.exportCSV = async (req, res, next) => {
    try {
        const { type } = req.params;
        const uf = userFilter(req);
        let data = [];
        let headers = '';

        if (type === 'sales') {
            const sales = await Sale.find(uf).populate('createdBy', 'name').sort({ createdAt: -1 });
            headers = 'Invoice,Date,Customer,Items,Subtotal,Tax,Discount,Total,Payment Status,Created By\n';
            data = sales.map((s) =>
                `${s.invoiceNumber},${new Date(s.createdAt).toLocaleDateString()},${s.customerName},${s.items.length},${s.subtotal},${s.taxAmount},${s.discount},${s.total},${s.paymentStatus},${s.createdBy?.name || 'N/A'}`
            );
        } else if (type === 'inventory') {
            const products = await Product.find(uf).populate('category', 'name').populate('supplier', 'name');
            headers = 'Name,SKU,Category,Supplier,Price,Cost,Quantity\n';
            data = products.map((p) =>
                `${p.name},${p.sku},${p.category?.name || 'N/A'},${p.supplier?.name || 'N/A'},${p.price},${p.cost},${p.quantity}`
            );
        } else if (type === 'employees') {
            const employees = await Employee.find();
            headers = 'Name,Email,Phone,Department,Position,Salary,Joining Date,Status\n';
            data = employees.map((e) =>
                `${e.name},${e.email},${e.phone},${e.department},${e.position},${e.salary},${new Date(e.joiningDate).toLocaleDateString()},${e.status}`
            );
        } else if (type === 'payroll') {
            const payrolls = await Payroll.find().populate('employee', 'name department position');
            headers = 'Employee,Department,Position,Base Salary,HRA,Transport,Medical,Other Allowance,Tax,PF,Insurance,Other Deduction,Total Allowances,Total Deductions,Net Salary,Status,Month,Year\n';
            data = payrolls.map((p) =>
                `${p.employee?.name || 'N/A'},${p.employee?.department || 'N/A'},${p.employee?.position || 'N/A'},${p.baseSalary},${p.allowances.hra},${p.allowances.transport},${p.allowances.medical},${p.allowances.other},${p.deductions.tax},${p.deductions.pf},${p.deductions.insurance},${p.deductions.other},${p.totalAllowances},${p.totalDeductions},${p.netSalary},${p.status},${p.month},${p.year}`
            );
        } else if (type === 'attendance') {
            const Attendance = require('../models/Attendance');
            const records = await Attendance.find().populate('employee', 'name department').sort({ date: -1 });
            headers = 'Employee,Department,Date,Status,Check In,Check Out,Notes\n';
            data = records.map((a) =>
                `${a.employee?.name || 'N/A'},${a.employee?.department || 'N/A'},${new Date(a.date).toLocaleDateString()},${a.status},${a.checkIn || 'N/A'},${a.checkOut || 'N/A'},${(a.notes || '').replace(/,/g, ';')}`
            );
        } else {
            return res.status(400).json({ success: false, message: 'Invalid export type' });
        }

        const csv = headers + data.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

// @desc    Get recent sales for dashboard chart
exports.getRecentSalesChart = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailySales = await Sale.aggregate([
            { $match: { ...userFilter(req), createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        res.json({ success: true, data: dailySales });
    } catch (error) {
        next(error);
    }
};
