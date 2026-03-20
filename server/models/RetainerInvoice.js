const mongoose = require('mongoose');

const retainerInvoiceSchema = new mongoose.Schema(
    {
        retainerNumber: { type: String, unique: true, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        amount: { type: Number, required: true },
        period: { type: String, default: '' },
        startDate: { type: Date },
        endDate: { type: Date },
        status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
        paymentMethod: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

retainerInvoiceSchema.index({ retainerNumber: 1 });
retainerInvoiceSchema.index({ customer: 1 });

module.exports = mongoose.model('RetainerInvoice', retainerInvoiceSchema);
