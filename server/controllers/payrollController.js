const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// @desc    Get all payroll records (with filters)
// @route   GET /api/payroll
exports.getPayrolls = async (req, res, next) => {
    try {
        const { month, year, status, employee } = req.query;
        const filter = {};
        if (month) filter.month = Number(month);
        if (year) filter.year = Number(year);
        if (status) filter.status = status;
        if (employee) filter.employee = employee;

        const payrolls = await Payroll.find(filter)
            .populate('employee', 'name email department position salary status')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: payrolls });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single payroll
// @route   GET /api/payroll/:id
exports.getPayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id)
            .populate('employee', 'name email department position salary status phone address joiningDate');
        if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
        res.json({ success: true, data: payroll });
    } catch (err) {
        next(err);
    }
};

// @desc    Generate payroll for all active employees for a given month/year
// @route   POST /api/payroll/generate
exports.generatePayroll = async (req, res, next) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year are required' });

        const activeEmployees = await Employee.find({ status: 'active' });
        if (activeEmployees.length === 0) return res.status(400).json({ success: false, message: 'No active employees found' });

        const results = { created: 0, skipped: 0, errors: [] };

        for (const emp of activeEmployees) {
            // Check if payroll already exists for this employee/month/year
            const exists = await Payroll.findOne({ employee: emp._id, month: Number(month), year: Number(year) });
            if (exists) {
                results.skipped++;
                continue;
            }

            // Auto-calculate default allowances & deductions based on salary
            const baseSalary = emp.salary;
            const hra = Math.round(baseSalary * 0.2);       // 20% HRA
            const transport = Math.round(baseSalary * 0.05); // 5% Transport
            const medical = Math.round(baseSalary * 0.03);   // 3% Medical
            const totalAllowances = hra + transport + medical;

            const tax = Math.round(baseSalary * 0.1);        // 10% Tax
            const pf = Math.round(baseSalary * 0.12);        // 12% PF
            const totalDeductions = tax + pf;

            const netSalary = baseSalary + totalAllowances - totalDeductions;

            try {
                await Payroll.create({
                    employee: emp._id,
                    month: Number(month),
                    year: Number(year),
                    baseSalary,
                    allowances: { hra, transport, medical, other: 0 },
                    deductions: { tax, pf, insurance: 0, other: 0 },
                    totalAllowances,
                    totalDeductions,
                    netSalary,
                    status: 'draft',
                });
                results.created++;
            } catch (createErr) {
                results.errors.push(`${emp.name}: ${createErr.message}`);
            }
        }

        res.status(201).json({
            success: true,
            message: `Payroll generated: ${results.created} created, ${results.skipped} skipped (already exist)`,
            data: results,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a payroll record (edit allowances/deductions)
// @route   PUT /api/payroll/:id
exports.updatePayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });

        const { allowances, deductions, notes, status } = req.body;

        if (allowances) {
            payroll.allowances = { ...payroll.allowances.toObject(), ...allowances };
        }
        if (deductions) {
            payroll.deductions = { ...payroll.deductions.toObject(), ...deductions };
        }
        if (notes !== undefined) payroll.notes = notes;
        if (status) {
            payroll.status = status;
            if (status === 'paid' && !payroll.paidDate) payroll.paidDate = new Date();
        }

        // Recalculate totals
        const a = payroll.allowances;
        payroll.totalAllowances = (a.hra || 0) + (a.transport || 0) + (a.medical || 0) + (a.other || 0);
        const d = payroll.deductions;
        payroll.totalDeductions = (d.tax || 0) + (d.pf || 0) + (d.insurance || 0) + (d.other || 0);
        payroll.netSalary = payroll.baseSalary + payroll.totalAllowances - payroll.totalDeductions;

        await payroll.save();

        const updated = await Payroll.findById(payroll._id).populate('employee', 'name email department position salary status');
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
};

// @desc    Process payroll (mark as processed)
// @route   PUT /api/payroll/:id/process
exports.processPayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
        if (payroll.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft payrolls can be processed' });

        payroll.status = 'processed';
        await payroll.save();

        const updated = await Payroll.findById(payroll._id).populate('employee', 'name email department position salary status');
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark payroll as paid
// @route   PUT /api/payroll/:id/pay
exports.payPayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
        if (payroll.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

        payroll.status = 'paid';
        payroll.paidDate = new Date();
        await payroll.save();

        const updated = await Payroll.findById(payroll._id).populate('employee', 'name email department position salary status');
        res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a payroll record
// @route   DELETE /api/payroll/:id
exports.deletePayroll = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
        if (payroll.status === 'paid') return res.status(400).json({ success: false, message: 'Cannot delete paid payroll' });

        await payroll.deleteOne();
        res.json({ success: true, message: 'Payroll deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc    Get payroll summary for a given month/year
// @route   GET /api/payroll/summary
exports.getPayrollSummary = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });

        const payrolls = await Payroll.find({ month: Number(month), year: Number(year) })
            .populate('employee', 'name department');

        const totalBase = payrolls.reduce((s, p) => s + p.baseSalary, 0);
        const totalAllowances = payrolls.reduce((s, p) => s + p.totalAllowances, 0);
        const totalDeductions = payrolls.reduce((s, p) => s + p.totalDeductions, 0);
        const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);

        const byStatus = { draft: 0, processed: 0, paid: 0 };
        payrolls.forEach(p => byStatus[p.status]++);

        res.json({
            success: true,
            data: {
                count: payrolls.length,
                totalBase,
                totalAllowances,
                totalDeductions,
                totalNet,
                byStatus,
            },
        });
    } catch (err) {
        next(err);
    }
};
