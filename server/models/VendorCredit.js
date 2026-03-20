const mongoose = require('mongoose');

const vendorCreditSchema = new mongoose.Schema(
    {
        creditNumber: { type: String, unique: true, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
        vendorName: { type: String, default: '' },
        bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
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
        taxAmount: { type: Number, default: 0 },
        total: { type: Number, required: true },
        reason: { type: String, enum: ['return', 'damaged', 'overcharge', 'other'], default: 'return' },
        status: { type: String, enum: ['draft', 'issued', 'applied'], default: 'draft' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

vendorCreditSchema.index({ creditNumber: 1 });
vendorCreditSchema.index({ vendor: 1 });

module.exports = mongoose.model('VendorCredit', vendorCreditSchema);
