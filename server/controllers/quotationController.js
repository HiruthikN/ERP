const Quotation = require('../models/Quotation');
const Product = require('../models/Product');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

const generateNumber = async () => {
    const last = await Quotation.findOne().sort({ createdAt: -1 });
    const num = last ? parseInt(last.quotationNumber.replace('QUO-', '')) + 1 : 1;
    return `QUO-${String(num).padStart(4, '0')}`;
};

exports.getQuotations = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { ...userFilter(req) };
        if (status) filter.status = status;
        const quotations = await Quotation.find(filter)
            .populate('items.product', 'name price')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: quotations });
    } catch (err) { next(err); }
};

exports.getQuotation = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('items.product', 'name price sku')
            .populate('createdBy', 'name');
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        res.json({ success: true, data: q });
    } catch (err) { next(err); }
};

exports.createQuotation = async (req, res, next) => {
    try {
        const quotationNumber = await generateNumber();
        const { items, customerName, customerPhone, customerEmail, taxRate, discount, validUntil, notes } = req.body;

        const populatedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.product}` });
            populatedItems.push({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                price: item.price || product.price,
                total: (item.price || product.price) * item.quantity,
            });
        }

        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const tax = taxRate ? Number(taxRate) : 0;
        const taxAmount = (subtotal * tax) / 100;
        const disc = discount ? Number(discount) : 0;
        const total = subtotal + taxAmount - disc;

        const quotation = await Quotation.create({
            quotationNumber, items: populatedItems, customerName, customerPhone, customerEmail,
            subtotal, taxRate: tax, taxAmount, discount: disc, total,
            validUntil, notes, createdBy: req.user._id,
        });

        res.status(201).json({ success: true, data: quotation });
    } catch (err) { next(err); }
};

exports.updateQuotation = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        if (q.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft quotations can be edited' });

        const allowed = ['customerName', 'customerPhone', 'customerEmail', 'taxRate', 'discount', 'validUntil', 'notes', 'items'];
        allowed.forEach(f => { if (req.body[f] !== undefined) q[f] = req.body[f]; });

        if (req.body.items) {
            const populatedItems = [];
            for (const item of req.body.items) {
                const product = await Product.findById(item.product);
                if (!product) return res.status(400).json({ success: false, message: `Product not found` });
                populatedItems.push({
                    product: product._id, productName: product.name,
                    quantity: item.quantity, price: item.price || product.price,
                    total: (item.price || product.price) * item.quantity,
                });
            }
            q.items = populatedItems;
        }

        q.subtotal = q.items.reduce((s, i) => s + i.total, 0);
        q.taxAmount = (q.subtotal * q.taxRate) / 100;
        q.total = q.subtotal + q.taxAmount - q.discount;
        await q.save();

        res.json({ success: true, data: q });
    } catch (err) { next(err); }
};

exports.deleteQuotation = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        if (q.status === 'approved') return res.status(400).json({ success: false, message: 'Cannot delete approved quotation' });
        await q.deleteOne();
        res.json({ success: true, message: 'Quotation deleted' });
    } catch (err) { next(err); }
};

exports.approveQuotation = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        q.status = 'approved';
        await q.save();
        res.json({ success: true, data: q });
    } catch (err) { next(err); }
};

exports.rejectQuotation = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        q.status = 'rejected';
        await q.save();
        res.json({ success: true, data: q });
    } catch (err) { next(err); }
};

exports.sendQuotation = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        q.status = 'sent';
        await q.save();
        res.json({ success: true, data: q });
    } catch (err) { next(err); }
};

// Convert approved quotation to sales order
exports.convertToOrder = async (req, res, next) => {
    try {
        const q = await Quotation.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
        if (q.status !== 'approved') return res.status(400).json({ success: false, message: 'Only approved quotations can be converted' });

        const SalesOrder = require('../models/SalesOrder');
        const lastSO = await SalesOrder.findOne().sort({ createdAt: -1 });
        const soNum = lastSO ? parseInt(lastSO.orderNumber.replace('SO-', '')) + 1 : 1;
        const orderNumber = `SO-${String(soNum).padStart(4, '0')}`;

        const order = await SalesOrder.create({
            orderNumber, quotation: q._id,
            customerName: q.customerName, customerPhone: q.customerPhone,
            items: q.items, subtotal: q.subtotal, taxRate: q.taxRate,
            taxAmount: q.taxAmount, discount: q.discount, total: q.total,
            notes: q.notes, createdBy: req.user._id,
        });

        res.status(201).json({ success: true, data: order, message: 'Sales order created from quotation' });
    } catch (err) { next(err); }
};
