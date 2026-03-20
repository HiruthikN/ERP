const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };
const gen = async () => { const l = await PurchaseOrder.findOne().sort({ createdAt: -1 }); const n = l ? parseInt(l.poNumber.replace('PO-', '')) + 1 : 1; return `PO-${String(n).padStart(4, '0')}`; };

exports.getAll = async (req, res, next) => { try { const { status } = req.query; const f = { ...userFilter(req) }; if (status) f.status = status; const d = await PurchaseOrder.find(f).populate('vendor', 'name').populate('items.product', 'name price').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) }).populate('vendor', 'name email phone').populate('items.product', 'name price sku').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const poNumber = await gen();
        const { items, vendor, vendorName, taxRate, discount, expectedDate, notes } = req.body;
        const populatedItems = [];
        for (const item of items) { const p = await Product.findById(item.product); if (!p) return res.status(400).json({ success: false, message: 'Product not found' }); populatedItems.push({ product: p._id, productName: p.name, quantity: item.quantity, price: item.price || p.cost || p.price, total: (item.price || p.cost || p.price) * item.quantity }); }
        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const tax = taxRate ? Number(taxRate) : 0; const taxAmount = (subtotal * tax) / 100;
        const disc = discount ? Number(discount) : 0; const total = subtotal + taxAmount - disc;
        const d = await PurchaseOrder.create({ poNumber, vendor, vendorName, items: populatedItems, subtotal, taxRate: tax, taxAmount, discount: disc, total, expectedDate, notes, createdBy: req.user._id });
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.update = async (req, res, next) => { try { const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); if (d.status !== 'draft') return res.status(400).json({ success: false, message: 'Only drafts can be edited' }); Object.assign(d, req.body); await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); if (!['draft', 'cancelled'].includes(d.status)) return res.status(400).json({ success: false, message: 'Cannot delete' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
exports.send = async (req, res, next) => { try { const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.status = 'sent'; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.receive = async (req, res, next) => {
    try {
        const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!d) return res.status(404).json({ success: false, message: 'Not found' });
        for (const item of d.items) { const p = await Product.findById(item.product); if (p) { p.quantity += item.quantity; await p.save(); } }
        d.status = 'received'; await d.save();
        res.json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.cancel = async (req, res, next) => { try { const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.status = 'cancelled'; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.createBill = async (req, res, next) => {
    try {
        const d = await PurchaseOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!d) return res.status(404).json({ success: false, message: 'Not found' });
        if (d.status !== 'received') return res.status(400).json({ success: false, message: 'PO must be received first' });
        const Bill = require('../models/Bill');
        const lastB = await Bill.findOne().sort({ createdAt: -1 }); const bNum = lastB ? parseInt(lastB.billNumber.replace('BILL-', '')) + 1 : 1;
        const bill = await Bill.create({ billNumber: `BILL-${String(bNum).padStart(4, '0')}`, vendor: d.vendor, vendorName: d.vendorName, purchaseOrder: d._id, items: d.items, subtotal: d.subtotal, taxRate: d.taxRate, taxAmount: d.taxAmount, discount: d.discount, total: d.total, notes: d.notes, createdBy: req.user._id });
        res.status(201).json({ success: true, data: bill, message: 'Bill created from PO' });
    } catch (e) { next(e); }
};
