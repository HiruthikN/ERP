const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

const generateNumber = async () => {
    const last = await SalesOrder.findOne().sort({ createdAt: -1 });
    const num = last ? parseInt(last.orderNumber.replace('SO-', '')) + 1 : 1;
    return `SO-${String(num).padStart(4, '0')}`;
};

exports.getSalesOrders = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { ...userFilter(req) };
        if (status) filter.status = status;
        const orders = await SalesOrder.find(filter)
            .populate('quotation', 'quotationNumber')
            .populate('items.product', 'name price')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) { next(err); }
};

exports.getSalesOrder = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('quotation', 'quotationNumber')
            .populate('items.product', 'name price sku')
            .populate('createdBy', 'name');
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        res.json({ success: true, data: o });
    } catch (err) { next(err); }
};

exports.createSalesOrder = async (req, res, next) => {
    try {
        const orderNumber = await generateNumber();
        const { items, customerName, customerPhone, taxRate, discount, notes, quotation } = req.body;

        const populatedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(400).json({ success: false, message: `Product not found` });
            populatedItems.push({
                product: product._id, productName: product.name,
                quantity: item.quantity, price: item.price || product.price,
                total: (item.price || product.price) * item.quantity,
            });
        }

        const subtotal = populatedItems.reduce((s, i) => s + i.total, 0);
        const tax = taxRate ? Number(taxRate) : 0;
        const taxAmount = (subtotal * tax) / 100;
        const disc = discount ? Number(discount) : 0;
        const total = subtotal + taxAmount - disc;

        const order = await SalesOrder.create({
            orderNumber, quotation: quotation || undefined,
            items: populatedItems, customerName, customerPhone,
            subtotal, taxRate: tax, taxAmount, discount: disc, total,
            notes, createdBy: req.user._id,
        });

        res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
};

exports.updateSalesOrder = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        if (o.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft orders can be edited' });

        const allowed = ['customerName', 'customerPhone', 'taxRate', 'discount', 'notes'];
        allowed.forEach(f => { if (req.body[f] !== undefined) o[f] = req.body[f]; });

        if (req.body.items) {
            const populatedItems = [];
            for (const item of req.body.items) {
                const product = await Product.findById(item.product);
                if (!product) return res.status(400).json({ success: false, message: 'Product not found' });
                populatedItems.push({
                    product: product._id, productName: product.name,
                    quantity: item.quantity, price: item.price || product.price,
                    total: (item.price || product.price) * item.quantity,
                });
            }
            o.items = populatedItems;
        }

        o.subtotal = o.items.reduce((s, i) => s + i.total, 0);
        o.taxAmount = (o.subtotal * o.taxRate) / 100;
        o.total = o.subtotal + o.taxAmount - o.discount;
        await o.save();

        res.json({ success: true, data: o });
    } catch (err) { next(err); }
};

exports.deleteSalesOrder = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        if (!['draft', 'cancelled'].includes(o.status)) return res.status(400).json({ success: false, message: 'Cannot delete active order' });
        await o.deleteOne();
        res.json({ success: true, message: 'Sales order deleted' });
    } catch (err) { next(err); }
};

exports.confirmOrder = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        if (o.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft orders can be confirmed' });
        o.status = 'confirmed';
        await o.save();
        res.json({ success: true, data: o });
    } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        if (o.status === 'invoiced') return res.status(400).json({ success: false, message: 'Cannot cancel invoiced order' });
        o.status = 'cancelled';
        await o.save();
        res.json({ success: true, data: o });
    } catch (err) { next(err); }
};

// Create invoice from sales order
exports.createInvoice = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        if (!['confirmed', 'delivered'].includes(o.status)) return res.status(400).json({ success: false, message: 'Order must be confirmed first' });

        const Sale = require('../models/Sale');
        const lastSale = await Sale.findOne().sort({ createdAt: -1 });
        let nextNum = 1;
        if (lastSale && lastSale.invoiceNumber) {
            nextNum = parseInt(lastSale.invoiceNumber.replace('INV-', '')) + 1;
        }
        const invoiceNumber = `INV-${String(nextNum).padStart(4, '0')}`;

        // Deduct stock
        for (const item of o.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.quantity = Math.max(0, product.quantity - item.quantity);
                await product.save();
            }
        }

        const sale = await Sale.create({
            invoiceNumber, salesOrder: o._id,
            items: o.items, subtotal: o.subtotal, taxRate: o.taxRate,
            taxAmount: o.taxAmount, discount: o.discount, total: o.total,
            customerName: o.customerName, customerPhone: o.customerPhone,
            createdBy: req.user._id,
        });

        o.status = 'invoiced';
        await o.save();

        res.status(201).json({ success: true, data: sale, message: 'Invoice created from sales order' });
    } catch (err) { next(err); }
};

// Create delivery note from sales order
exports.createDeliveryNote = async (req, res, next) => {
    try {
        const o = await SalesOrder.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!o) return res.status(404).json({ success: false, message: 'Sales order not found' });
        if (!['confirmed', 'invoiced'].includes(o.status)) return res.status(400).json({ success: false, message: 'Order must be confirmed first' });

        const DeliveryNote = require('../models/DeliveryNote');
        const lastDN = await DeliveryNote.findOne().sort({ createdAt: -1 });
        const dnNum = lastDN ? parseInt(lastDN.deliveryNumber.replace('DN-', '')) + 1 : 1;
        const deliveryNumber = `DN-${String(dnNum).padStart(4, '0')}`;

        const dnItems = o.items.map(i => ({ product: i.product, productName: i.productName, quantity: i.quantity }));

        const dn = await DeliveryNote.create({
            deliveryNumber, salesOrder: o._id, customerName: o.customerName,
            items: dnItems, shippingAddress: req.body.shippingAddress || '',
            notes: req.body.notes || '', createdBy: req.user._id,
        });

        if (o.status === 'confirmed') { o.status = 'delivered'; await o.save(); }

        res.status(201).json({ success: true, data: dn, message: 'Delivery note created' });
    } catch (err) { next(err); }
};
