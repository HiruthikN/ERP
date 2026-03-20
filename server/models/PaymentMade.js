const mongoose = require('mongoose');

const paymentMadeSchema = new mongoose.Schema(
    {
        paymentNumber: { type: String, unique: true, required: true },
        bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'], default: 'cash' },
        referenceNumber: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

paymentMadeSchema.index({ paymentNumber: 1 });
paymentMadeSchema.index({ bill: 1 });

module.exports = mongoose.model('PaymentMade', paymentMadeSchema);
