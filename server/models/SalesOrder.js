const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, unique: true, required: true },
        quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
        customerName: { type: String, default: 'Walk-in Customer' },
        customerPhone: { type: String, default: '' },
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
        status: {
            type: String,
            enum: ['draft', 'confirmed', 'delivered', 'invoiced', 'cancelled'],
            default: 'draft',
        },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

salesOrderSchema.index({ orderNumber: 1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
