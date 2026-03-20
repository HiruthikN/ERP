const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema(
    {
        profileName: { type: String, required: true },
        category: { type: String, required: true },
        amount: { type: Number, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        vendorName: { type: String, default: '' },
        frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
        nextDate: { type: Date, required: true },
        endDate: { type: Date },
        active: { type: Boolean, default: true },
        description: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

recurringExpenseSchema.index({ active: 1 });
recurringExpenseSchema.index({ nextDate: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
