const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

// Generate unique invoice number
const generateInvoiceNumber = async () => {
    const count = await Sale.countDocuments();
    const date = new Date();
    const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Create sale
exports.createSale = async (req, res, next) => {
    try {
        const { items, taxRate = 0, discount = 0, paymentStatus, paymentMethod, customerName, customerPhone, notes, paidAmount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }

        // Validate stock and calculate totals
        let subtotal = 0;
        const saleItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            saleItems.push({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                price: product.price,
                total: itemTotal,
            });

            // Deduct stock
            product.quantity -= item.quantity;
            await product.save();
        }

        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount - discount;

        const sale = await Sale.create({
            invoiceNumber: await generateInvoiceNumber(),
            items: saleItems,
            subtotal,
            taxRate,
            taxAmount,
            discount,
            total,
            paidAmount: paymentStatus === 'paid' ? total : (paymentStatus === 'partial' ? (paidAmount || 0) : 0),
            paymentStatus: paymentStatus || 'pending',
            paymentMethod: paymentMethod || 'cash',
            customerName: customerName || 'Walk-in Customer',
            customerPhone,
            notes,
            createdBy: req.user._id,
        });

        const populated = await sale.populate([
            { path: 'items.product', select: 'name sku' },
            { path: 'createdBy', select: 'name' },
        ]);

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all sales
exports.getSales = async (req, res, next) => {
    try {
        const { startDate, endDate, paymentStatus } = req.query;
        let query = { ...userFilter(req) };

        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const sales = await Sale.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: sales, count: sales.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single sale
exports.getSale = async (req, res, next) => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('items.product', 'name sku')
            .populate('createdBy', 'name');
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }
        res.json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

// @desc    Update payment status + paid amount
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus, paidAmount } = req.body;
        const sale = await Sale.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        sale.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid') {
            sale.paidAmount = sale.total;
        } else if (paymentStatus === 'partial') {
            sale.paidAmount = paidAmount !== undefined ? paidAmount : sale.paidAmount;
        } else {
            sale.paidAmount = 0;
        }
        await sale.save();
        res.json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate invoice PDF
exports.getInvoicePDF = async (req, res, next) => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('items.product', 'name sku')
            .populate('createdBy', 'name');

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${sale.invoiceNumber}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Invoice #: ${sale.invoiceNumber}`, { align: 'right' });
        doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.text(`Status: ${sale.paymentStatus.toUpperCase()}`, { align: 'right' });
        doc.moveDown();

        // Company info
        doc.fontSize(14).font('Helvetica-Bold').text('ERP System');
        doc.fontSize(9).font('Helvetica').text('Small Business ERP Solution');
        doc.moveDown();

        // Customer info
        doc.fontSize(10).font('Helvetica-Bold').text('Bill To:');
        doc.font('Helvetica').text(sale.customerName);
        if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`);
        doc.moveDown();

        // Table header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 280, tableTop, { width: 60, align: 'center' });
        doc.text('Price', 350, tableTop, { width: 80, align: 'right' });
        doc.text('Total', 440, tableTop, { width: 80, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();

        // Table rows
        let y = tableTop + 25;
        doc.font('Helvetica').fontSize(9);
        for (const item of sale.items) {
            doc.text(item.productName, 50, y);
            doc.text(String(item.quantity), 280, y, { width: 60, align: 'center' });
            doc.text(`$${item.price.toFixed(2)}`, 350, y, { width: 80, align: 'right' });
            doc.text(`$${item.total.toFixed(2)}`, 440, y, { width: 80, align: 'right' });
            y += 20;
        }

        doc.moveTo(50, y).lineTo(520, y).stroke();
        y += 15;

        // Totals
        doc.font('Helvetica').fontSize(9);
        doc.text('Subtotal:', 350, y, { width: 80, align: 'right' });
        doc.text(`$${sale.subtotal.toFixed(2)}`, 440, y, { width: 80, align: 'right' });
        y += 18;
        doc.text(`Tax (${sale.taxRate}%):`, 350, y, { width: 80, align: 'right' });
        doc.text(`$${sale.taxAmount.toFixed(2)}`, 440, y, { width: 80, align: 'right' });
        y += 18;
        doc.text('Discount:', 350, y, { width: 80, align: 'right' });
        doc.text(`-$${sale.discount.toFixed(2)}`, 440, y, { width: 80, align: 'right' });
        y += 20;

        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('TOTAL:', 350, y, { width: 80, align: 'right' });
        doc.text(`$${sale.total.toFixed(2)}`, 440, y, { width: 80, align: 'right' });

        // Footer
        doc.moveDown(4);
        doc.fontSize(8).font('Helvetica').text('Thank you for your business!', { align: 'center' });

        doc.end();
    } catch (error) {
        next(error);
    }
};
