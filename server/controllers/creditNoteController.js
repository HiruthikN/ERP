const CreditNote = require('../models/CreditNote');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

const generateNumber = async () => {
    const last = await CreditNote.findOne().sort({ createdAt: -1 });
    const num = last ? parseInt(last.creditNumber.replace('CN-', '')) + 1 : 1;
    return `CN-${String(num).padStart(4, '0')}`;
};

exports.getCreditNotes = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { ...userFilter(req) };
        if (status) filter.status = status;
        const notes = await CreditNote.find(filter)
            .populate('invoice', 'invoiceNumber customerName total')
            .populate('items.product', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: notes });
    } catch (err) { next(err); }
};

exports.getCreditNote = async (req, res, next) => {
    try {
        const cn = await CreditNote.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('invoice', 'invoiceNumber customerName total items')
            .populate('items.product', 'name sku price')
            .populate('createdBy', 'name');
        if (!cn) return res.status(404).json({ success: false, message: 'Credit note not found' });
        res.json({ success: true, data: cn });
    } catch (err) { next(err); }
};

exports.createCreditNote = async (req, res, next) => {
    try {
        const { invoice, items, reason, notes } = req.body;
        const sale = await Sale.findById(invoice);
        if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });

        const creditNumber = await generateNumber();

        const populatedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(400).json({ success: false, message: 'Product not found' });
            populatedItems.push({
                product: product._id, productName: product.name,
                quantity: item.quantity, price: item.price || product.price,
                total: (item.price || product.price) * item.quantity,
            });
        }

        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const taxAmount = sale.taxRate ? (subtotal * sale.taxRate) / 100 : 0;
        const total = subtotal + taxAmount;

        const cn = await CreditNote.create({
            creditNumber, invoice, customerName: sale.customerName,
            items: populatedItems, subtotal, taxAmount, total,
            reason: reason || 'return', notes, createdBy: req.user._id,
        });

        res.status(201).json({ success: true, data: cn });
    } catch (err) { next(err); }
};

exports.issueCreditNote = async (req, res, next) => {
    try {
        const cn = await CreditNote.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!cn) return res.status(404).json({ success: false, message: 'Not found' });
        if (cn.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft notes can be issued' });
        cn.status = 'issued';
        await cn.save();
        res.json({ success: true, data: cn });
    } catch (err) { next(err); }
};

exports.applyCreditNote = async (req, res, next) => {
    try {
        const cn = await CreditNote.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!cn) return res.status(404).json({ success: false, message: 'Not found' });
        if (cn.status !== 'issued') return res.status(400).json({ success: false, message: 'Only issued notes can be applied' });

        // Restore stock for returned items
        for (const item of cn.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.quantity += item.quantity;
                await product.save();
            }
        }

        cn.status = 'applied';
        await cn.save();
        res.json({ success: true, data: cn });
    } catch (err) { next(err); }
};

exports.deleteCreditNote = async (req, res, next) => {
    try {
        const cn = await CreditNote.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!cn) return res.status(404).json({ success: false, message: 'Not found' });
        if (cn.status === 'applied') return res.status(400).json({ success: false, message: 'Cannot delete applied credit note' });
        await cn.deleteOne();
        res.json({ success: true, message: 'Credit note deleted' });
    } catch (err) { next(err); }
};
