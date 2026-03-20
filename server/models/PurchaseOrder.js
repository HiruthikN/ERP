const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
    {
        poNumber: { type: String, unique: true, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
        vendorName: { type: String, default: '' },
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
        expectedDate: { type: Date },
        status: { type: String, enum: ['draft', 'sent', 'received', 'cancelled'], default: 'draft' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ vendor: 1 });
purchaseOrderSchema.index({ status: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
