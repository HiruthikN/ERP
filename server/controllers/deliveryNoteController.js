const DeliveryNote = require('../models/DeliveryNote');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

exports.getDeliveryNotes = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { ...userFilter(req) };
        if (status) filter.status = status;
        const notes = await DeliveryNote.find(filter)
            .populate('salesOrder', 'orderNumber customerName')
            .populate('items.product', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: notes });
    } catch (err) { next(err); }
};

exports.getDeliveryNote = async (req, res, next) => {
    try {
        const dn = await DeliveryNote.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('salesOrder', 'orderNumber customerName customerPhone')
            .populate('items.product', 'name sku')
            .populate('createdBy', 'name');
        if (!dn) return res.status(404).json({ success: false, message: 'Delivery note not found' });
        res.json({ success: true, data: dn });
    } catch (err) { next(err); }
};

exports.shipDelivery = async (req, res, next) => {
    try {
        const dn = await DeliveryNote.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!dn) return res.status(404).json({ success: false, message: 'Not found' });
        if (dn.status !== 'pending') return res.status(400).json({ success: false, message: 'Can only ship pending notes' });
        dn.status = 'shipped';
        await dn.save();
        res.json({ success: true, data: dn });
    } catch (err) { next(err); }
};

exports.deliverDelivery = async (req, res, next) => {
    try {
        const dn = await DeliveryNote.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!dn) return res.status(404).json({ success: false, message: 'Not found' });
        if (dn.status !== 'shipped') return res.status(400).json({ success: false, message: 'Can only deliver shipped notes' });
        dn.status = 'delivered';
        dn.deliveryDate = new Date();
        await dn.save();
        res.json({ success: true, data: dn });
    } catch (err) { next(err); }
};

exports.deleteDeliveryNote = async (req, res, next) => {
    try {
        const dn = await DeliveryNote.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!dn) return res.status(404).json({ success: false, message: 'Not found' });
        if (dn.status === 'delivered') return res.status(400).json({ success: false, message: 'Cannot delete delivered note' });
        await dn.deleteOne();
        res.json({ success: true, message: 'Delivery note deleted' });
    } catch (err) { next(err); }
};
