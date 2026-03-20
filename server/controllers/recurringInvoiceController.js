const RecurringInvoice = require('../models/RecurringInvoice');
const Product = require('../models/Product');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

exports.getAll = async (req, res, next) => { try { const d = await RecurringInvoice.find({ ...userFilter(req) }).populate('customer', 'name').populate('items.product', 'name price').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await RecurringInvoice.findOne({ _id: req.params.id, ...userFilter(req) }).populate('customer', 'name email phone').populate('items.product', 'name price').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const { items, customer, taxRate, discount, frequency, nextDate, endDate, notes, profileName } = req.body;
        const populatedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(400).json({ success: false, message: 'Product not found' });
            populatedItems.push({ product: product._id, productName: product.name, quantity: item.quantity, price: item.price || product.price, total: (item.price || product.price) * item.quantity });
        }
        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const tax = taxRate ? Number(taxRate) : 0;
        const taxAmount = (subtotal * tax) / 100;
        const disc = discount ? Number(discount) : 0;
        const total = subtotal + taxAmount - disc;
        const d = await RecurringInvoice.create({ profileName, customer, items: populatedItems, subtotal, taxRate: tax, taxAmount, discount: disc, total, frequency, nextDate, endDate, notes, createdBy: req.user._id });
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.update = async (req, res, next) => { try { const d = await RecurringInvoice.findOneAndUpdate({ _id: req.params.id, ...userFilter(req) }, req.body, { new: true, runValidators: true }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { const d = await RecurringInvoice.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
exports.toggle = async (req, res, next) => { try { const d = await RecurringInvoice.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); d.active = !d.active; await d.save(); res.json({ success: true, data: d }); } catch (e) { next(e); } };
