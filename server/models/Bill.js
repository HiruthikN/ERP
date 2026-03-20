const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
    {
        billNumber: { type: String, unique: true, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
        vendorName: { type: String, default: '' },
        purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
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
        dueDate: { type: Date },
        paidAmount: { type: Number, default: 0 },
        status: { type: String, enum: ['draft', 'received', 'partial', 'paid', 'overdue'], default: 'draft' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

billSchema.index({ billNumber: 1 });
billSchema.index({ vendor: 1 });
billSchema.index({ status: 1 });

module.exports = mongoose.model('Bill', billSchema);
