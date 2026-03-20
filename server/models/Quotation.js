const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
    {
        quotationNumber: { type: String, unique: true, required: true },
        customerName: { type: String, default: 'Walk-in Customer' },
        customerPhone: { type: String, default: '' },
        customerEmail: { type: String, default: '' },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
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
        validUntil: { type: Date },
        status: {
            type: String,
            enum: ['draft', 'sent', 'approved', 'rejected', 'expired'],
            default: 'draft',
        },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
