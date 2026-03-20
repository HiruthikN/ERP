const PaymentReceived = require('../models/PaymentReceived');
const Sale = require('../models/Sale');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };
const gen = async () => { const l = await PaymentReceived.findOne().sort({ createdAt: -1 }); const n = l ? parseInt(l.paymentNumber.replace('PAY-', '')) + 1 : 1; return `PAY-${String(n).padStart(4, '0')}`; };

exports.getAll = async (req, res, next) => { try { const d = await PaymentReceived.find({ ...userFilter(req) }).populate('invoice', 'invoiceNumber total').populate('customer', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await PaymentReceived.findOne({ _id: req.params.id, ...userFilter(req) }).populate('invoice', 'invoiceNumber total customerName').populate('customer', 'name email phone').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const paymentNumber = await gen();
        const d = await PaymentReceived.create({ ...req.body, paymentNumber, createdBy: req.user._id });
        if (req.body.invoice) {
            const inv = await Sale.findById(req.body.invoice);
            if (inv) { inv.paidAmount = (inv.paidAmount || 0) + d.amount; if (inv.paidAmount >= inv.total) inv.paymentStatus = 'paid'; else inv.paymentStatus = 'partial'; await inv.save(); }
        }
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.remove = async (req, res, next) => { try { const d = await PaymentReceived.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
