const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Employee name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            default: '',
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            enum: ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance', 'Operations', 'Support', 'Management'],
        },
        position: {
            type: String,
            required: [true, 'Position is required'],
        },
        salary: {
            type: Number,
            required: [true, 'Salary is required'],
            min: 0,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'terminated'],
            default: 'active',
        },
        address: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
