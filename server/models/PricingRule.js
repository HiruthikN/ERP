const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Rule name is required'], trim: true },
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true,
        },
        value: { type: Number, required: true, min: 0 },
        appliesTo: {
            type: String,
            enum: ['all', 'category', 'product'],
            default: 'all',
        },
        targetCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        targetProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        minQuantity: { type: Number, default: 1, min: 1 },
        startDate: { type: Date },
        endDate: { type: Date },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

pricingRuleSchema.index({ active: 1 });
pricingRuleSchema.index({ appliesTo: 1 });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
