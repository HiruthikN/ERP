const RecurringBill = require('../models/RecurringBill');
const Product = require('../models/Product');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

exports.getAll = async (req, res, next) => { try { const d = await RecurringBill.find({ ...userFilter(req) }).populate('vendor', 'name').populate('items.product', 'name price').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await RecurringBill.findOne({ _id: req.params.id, ...userFilter(req) }).populate('vendor', 'name email phone').populate('items.product', 'name price').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const { items, vendor, vendorName, taxRate, frequency, nextDate, endDate, notes, profileName } = req.body;
        const populatedItems = [];
        for (const item of items) { const p = await Product.findById(item.product); if (!p) return res.status(400).json({ success: false, message: 'Product not found' }); populatedItems.push({ product: p._id, productName: p.name, quantity: item.quantity, price: item.price || p.cost || p.price, total: (item.price || p.cost || p.price) * item.quantity }); }
        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const tax = taxRate ? Number(taxRate) : 0; const taxAmount = (subtotal * tax) / 100;
        const total = subtotal + taxAmount;
        const d = await RecurringBill.create({ profileName, vendor, vendorName, items: populatedItems, subtotal, taxRate: tax, taxAmount, total, frequency, nextDate, endDate, notes, createdBy: req.user._id });
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.update = async (req, res, next) => { try { const d = await RecurringBill.findOneAndUpdate({ _id: req.params.id, ...userFilter(req) }, req.body, { new: true, runValidators: true }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { const d = await RecurringBill.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
exports.toggle = async (req, res, next) => { try { const d = await RecurringBill.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.active = !d.active; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
