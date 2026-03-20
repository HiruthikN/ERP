const VendorCredit = require('../models/VendorCredit');
const Product = require('../models/Product');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };
const gen = async () => { const l = await VendorCredit.findOne().sort({ createdAt: -1 }); const n = l ? parseInt(l.creditNumber.replace('VC-', '')) + 1 : 1; return `VC-${String(n).padStart(4, '0')}`; };

exports.getAll = async (req, res, next) => { try { const { status } = req.query; const f = { ...userFilter(req) }; if (status) f.status = status; const d = await VendorCredit.find(f).populate('vendor', 'name').populate('bill', 'billNumber total').populate('items.product', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await VendorCredit.findOne({ _id: req.params.id, ...userFilter(req) }).populate('vendor', 'name email phone').populate('bill', 'billNumber total').populate('items.product', 'name price sku').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const creditNumber = await gen();
        const { items, vendor, vendorName, bill, reason, notes } = req.body;
        const populatedItems = [];
        for (const item of items) { const p = await Product.findById(item.product); if (!p) return res.status(400).json({ success: false, message: 'Product not found' }); populatedItems.push({ product: p._id, productName: p.name, quantity: item.quantity, price: item.price || p.cost || p.price, total: (item.price || p.cost || p.price) * item.quantity }); }
        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const total = subtotal;
        const d = await VendorCredit.create({ creditNumber, vendor, vendorName, bill, items: populatedItems, subtotal, total, reason, notes, createdBy: req.user._id });
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.remove = async (req, res, next) => { try { const d = await VendorCredit.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); if (d.status === 'applied') return res.status(400).json({ success: false, message: 'Cannot delete applied credit' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
exports.issue = async (req, res, next) => { try { const d = await VendorCredit.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.status = 'issued'; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.apply = async (req, res, next) => { try { const d = await VendorCredit.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.status = 'applied'; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
