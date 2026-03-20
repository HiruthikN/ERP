const PricingRule = require('../models/PricingRule');

exports.getPricingRules = async (req, res, next) => {
    try {
        const rules = await PricingRule.find()
            .populate('targetCategory', 'name')
            .populate('targetProduct', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: rules });
    } catch (err) { next(err); }
};

exports.getPricingRule = async (req, res, next) => {
    try {
        const rule = await PricingRule.findById(req.params.id)
            .populate('targetCategory', 'name')
            .populate('targetProduct', 'name');
        if (!rule) return res.status(404).json({ success: false, message: 'Pricing rule not found' });
        res.json({ success: true, data: rule });
    } catch (err) { next(err); }
};

exports.createPricingRule = async (req, res, next) => {
    try {
        const rule = await PricingRule.create(req.body);
        res.status(201).json({ success: true, data: rule });
    } catch (err) { next(err); }
};

exports.updatePricingRule = async (req, res, next) => {
    try {
        const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('targetCategory', 'name')
            .populate('targetProduct', 'name');
        if (!rule) return res.status(404).json({ success: false, message: 'Pricing rule not found' });
        res.json({ success: true, data: rule });
    } catch (err) { next(err); }
};

exports.deletePricingRule = async (req, res, next) => {
    try {
        const rule = await PricingRule.findById(req.params.id);
        if (!rule) return res.status(404).json({ success: false, message: 'Not found' });
        await rule.deleteOne();
        res.json({ success: true, message: 'Pricing rule deleted' });
    } catch (err) { next(err); }
};

exports.togglePricingRule = async (req, res, next) => {
    try {
        const rule = await PricingRule.findById(req.params.id);
        if (!rule) return res.status(404).json({ success: false, message: 'Not found' });
        rule.active = !rule.active;
        await rule.save();
        res.json({ success: true, data: rule });
    } catch (err) { next(err); }
};

// Get applicable rules for a product
exports.getApplicableRules = async (req, res, next) => {
    try {
        const { productId, categoryId, quantity } = req.query;
        const now = new Date();
        const filter = {
            active: true,
            $or: [
                { appliesTo: 'all' },
                { appliesTo: 'product', targetProduct: productId },
                ...(categoryId ? [{ appliesTo: 'category', targetCategory: categoryId }] : []),
            ],
            minQuantity: { $lte: Number(quantity) || 1 },
            $and: [
                { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
                { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
            ],
        };
        const rules = await PricingRule.find(filter).sort({ value: -1 });
        res.json({ success: true, data: rules });
    } catch (err) { next(err); }
};
