const Bill = require('../models/Bill');
const Product = require('../models/Product');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };
const gen = async () => { const l = await Bill.findOne().sort({ createdAt: -1 }); const n = l ? parseInt(l.billNumber.replace('BILL-', '')) + 1 : 1; return `BILL-${String(n).padStart(4, '0')}`; };

exports.getAll = async (req, res, next) => { try { const { status } = req.query; const f = { ...userFilter(req) }; if (status) f.status = status; const d = await Bill.find(f).populate('vendor', 'name').populate('purchaseOrder', 'poNumber').populate('items.product', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await Bill.findOne({ _id: req.params.id, ...userFilter(req) }).populate('vendor', 'name email phone').populate('purchaseOrder', 'poNumber').populate('items.product', 'name price sku').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const billNumber = await gen();
        const { items, vendor, vendorName, taxRate, discount, dueDate, notes } = req.body;
        const populatedItems = [];
        for (const item of items) { const p = await Product.findById(item.product); if (!p) return res.status(400).json({ success: false, message: 'Product not found' }); populatedItems.push({ product: p._id, productName: p.name, quantity: item.quantity, price: item.price || p.cost || p.price, total: (item.price || p.cost || p.price) * item.quantity }); }
        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const tax = taxRate ? Number(taxRate) : 0; const taxAmount = (subtotal * tax) / 100;
        const disc = discount ? Number(discount) : 0; const total = subtotal + taxAmount - disc;
        const d = await Bill.create({ billNumber, vendor, vendorName, items: populatedItems, subtotal, taxRate: tax, taxAmount, discount: disc, total, dueDate, notes, createdBy: req.user._id });
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.update = async (req, res, next) => { try { const d = await Bill.findOneAndUpdate({ _id: req.params.id, ...userFilter(req) }, req.body, { new: true, runValidators: true }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { const d = await Bill.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); if (d.status === 'paid') return res.status(400).json({ success: false, message: 'Cannot delete paid bill' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
exports.markReceived = async (req, res, next) => { try { const d = await Bill.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.status = 'received'; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
