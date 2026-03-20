const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
        },
        cost: {
            type: Number,
            default: 0,
            min: 0,
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: 0,
            default: 0,
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
        },
        unit: {
            type: String,
            default: 'pcs',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });

module.exports = mongoose.model('Product', productSchema);
