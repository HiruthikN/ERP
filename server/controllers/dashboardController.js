const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Employee = require('../models/Employee');

// @desc    Get dashboard stats
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({
            $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
        });
        const totalEmployees = await Employee.countDocuments({ status: 'active' });

        const salesAgg = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                },
            },
        ]);

        const stats = {
            totalSales: salesAgg[0]?.totalSales || 0,
            totalRevenue: salesAgg[0]?.totalRevenue || 0,
            totalProducts,
            lowStockProducts,
            totalEmployees,
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
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        } else {
            const now = new Date();
            const start = new Date();
            if (period === 'daily') start.setDate(now.getDate() - 30);
            else if (period === 'weekly') start.setDate(now.getDate() - 90);
            else if (period === 'monthly') start.setFullYear(now.getFullYear() - 1);
            dateFilter = { createdAt: { $gte: start, $lte: now } };
        }

        let groupFormat;
        if (period === 'daily') groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        else if (period === 'weekly') groupFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        else groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

        const report = await Sale.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: groupFormat,
                    totalSales: { $sum: 1 },
                    revenue: { $sum: '$total' },
                    avgOrderValue: { $avg: '$total' },
                },
            },
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
        const products = await Product.find()
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort({ quantity: 1 });

        const totalValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
        const totalCost = products.reduce((acc, p) => acc + p.cost * p.quantity, 0);

        res.json({
            success: true,
            data: {
                products,
                summary: {
                    totalProducts: products.length,
                    totalValue,
                    totalCost,
                    potentialProfit: totalValue - totalCost,
                },
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
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    totalSalary: { $sum: '$salary' },
                    avgSalary: { $avg: '$salary' },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const totalEmployees = await Employee.countDocuments({ status: 'active' });
        const totalSalaryExpense = departmentStats.reduce((acc, d) => acc + d.totalSalary, 0);

        res.json({
            success: true,
            data: {
                departmentStats,
                summary: { totalEmployees, totalSalaryExpense },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get profit report
exports.getProfitReport = async (req, res, next) => {
    try {
        const sales = await Sale.find().populate('items.product', 'cost');

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
                totalRevenue,
                totalCost,
                grossProfit: totalRevenue - totalCost,
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
        let data = [];
        let headers = '';

        if (type === 'sales') {
            const sales = await Sale.find().populate('createdBy', 'name').sort({ createdAt: -1 });
            headers = 'Invoice,Date,Customer,Items,Subtotal,Tax,Discount,Total,Payment Status,Created By\n';
            data = sales.map((s) =>
                `${s.invoiceNumber},${new Date(s.createdAt).toLocaleDateString()},${s.customerName},${s.items.length},${s.subtotal},${s.taxAmount},${s.discount},${s.total},${s.paymentStatus},${s.createdBy?.name || 'N/A'}`
            );
        } else if (type === 'inventory') {
            const products = await Product.find().populate('category', 'name').populate('supplier', 'name');
            headers = 'Name,SKU,Category,Supplier,Price,Cost,Quantity,Low Stock Threshold\n';
            data = products.map((p) =>
                `${p.name},${p.sku},${p.category?.name || 'N/A'},${p.supplier?.name || 'N/A'},${p.price},${p.cost},${p.quantity},${p.lowStockThreshold}`
            );
        } else if (type === 'employees') {
            const employees = await Employee.find();
            headers = 'Name,Email,Phone,Department,Position,Salary,Joining Date,Status\n';
            data = employees.map((e) =>
                `${e.name},${e.email},${e.phone},${e.department},${e.position},${e.salary},${new Date(e.joiningDate).toLocaleDateString()},${e.status}`
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
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({ success: true, data: dailySales });
    } catch (error) {
        next(error);
    }
};
