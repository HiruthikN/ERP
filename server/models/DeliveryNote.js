const mongoose = require('mongoose');

const deliveryNoteSchema = new mongoose.Schema(
    {
        deliveryNumber: { type: String, unique: true, required: true },
        salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
        customerName: { type: String, default: '' },
        items: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                productName: String,
                quantity: { type: Number, required: true, min: 1 },
            },
        ],
        deliveryDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['pending', 'shipped', 'delivered'],
            default: 'pending',
        },
        shippingAddress: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

deliveryNoteSchema.index({ deliveryNumber: 1 });
deliveryNoteSchema.index({ salesOrder: 1 });
deliveryNoteSchema.index({ status: 1 });

module.exports = mongoose.model('DeliveryNote', deliveryNoteSchema);
