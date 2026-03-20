const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        expenseNumber: { type: String, unique: true, required: true },
        category: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        vendorName: { type: String, default: '' },
        receipt: { type: String, default: '' },
        description: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
        paymentMethod: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

expenseSchema.index({ expenseNumber: 1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
