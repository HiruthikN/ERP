const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema(
    {
        creditNumber: { type: String, unique: true, required: true },
        invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
        customerName: { type: String, default: '' },
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
        taxAmount: { type: Number, default: 0 },
        total: { type: Number, required: true },
        reason: {
            type: String,
            enum: ['return', 'damaged', 'overcharge', 'other'],
            default: 'return',
        },
        status: {
            type: String,
            enum: ['draft', 'issued', 'applied'],
            default: 'draft',
        },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

creditNoteSchema.index({ creditNumber: 1 });
creditNoteSchema.index({ invoice: 1 });
creditNoteSchema.index({ status: 1 });

module.exports = mongoose.model('CreditNote', creditNoteSchema);
