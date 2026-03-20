const mongoose = require('mongoose');

const recurringInvoiceSchema = new mongoose.Schema(
    {
        profileName: { type: String, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                productName: String,
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true },
                total: { type: Number, required: true },
            },
        ],
        subtotal: { type: Number, required: true },
        taxRate: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
        frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
        nextDate: { type: Date, required: true },
        endDate: { type: Date },
        active: { type: Boolean, default: true },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

recurringInvoiceSchema.index({ active: 1 });
recurringInvoiceSchema.index({ nextDate: 1 });

module.exports = mongoose.model('RecurringInvoice', recurringInvoiceSchema);
