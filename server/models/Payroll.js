const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Employee is required'],
        },
        month: {
            type: Number,
            required: [true, 'Month is required'],
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
        },
        baseSalary: {
            type: Number,
            required: true,
            min: 0,
        },
        allowances: {
            hra: { type: Number, default: 0 },
            transport: { type: Number, default: 0 },
            medical: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
        deductions: {
            tax: { type: Number, default: 0 },
            pf: { type: Number, default: 0 },
            insurance: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
        totalAllowances: {
            type: Number,
            default: 0,
        },
        totalDeductions: {
            type: Number,
            default: 0,
        },
        netSalary: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['draft', 'processed', 'paid'],
            default: 'draft',
        },
        paidDate: {
            type: Date,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

// One payroll per employee per month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ month: 1, year: 1 });
payrollSchema.index({ status: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
