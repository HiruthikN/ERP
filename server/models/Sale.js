const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            unique: true,
            required: true,
        },
        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SalesOrder',
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                productName: String,
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
                total: {
                    type: Number,
                    required: true,
                },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        taxRate: {
            type: Number,
            default: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'pending', 'partial'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
            default: 'cash',
        },
        customerName: {
            type: String,
            default: 'Walk-in Customer',
        },
        customerPhone: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Sale', saleSchema);
