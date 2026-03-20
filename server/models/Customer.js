const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Customer name is required'], trim: true },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        company: { type: String, default: '' },
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        gstNumber: { type: String, default: '' },
        notes: { type: String, default: '' },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

customerSchema.index({ name: 1 });
customerSchema.index({ email: 1 });

module.exports = mongoose.model('Customer', customerSchema);
