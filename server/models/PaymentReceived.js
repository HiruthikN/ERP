const mongoose = require('mongoose');

const paymentReceivedSchema = new mongoose.Schema(
    {
        paymentNumber: { type: String, unique: true, required: true },
        invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'], default: 'cash' },
        referenceNumber: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

paymentReceivedSchema.index({ paymentNumber: 1 });
paymentReceivedSchema.index({ invoice: 1 });

module.exports = mongoose.model('PaymentReceived', paymentReceivedSchema);
