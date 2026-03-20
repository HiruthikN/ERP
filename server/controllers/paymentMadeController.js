const PaymentMade = require('../models/PaymentMade');
const Bill = require('../models/Bill');
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };
const gen = async () => { const l = await PaymentMade.findOne().sort({ createdAt: -1 }); const n = l ? parseInt(l.paymentNumber.replace('PMT-', '')) + 1 : 1; return `PMT-${String(n).padStart(4, '0')}`; };

exports.getAll = async (req, res, next) => { try { const d = await PaymentMade.find({ ...userFilter(req) }).populate('bill', 'billNumber total').populate('vendor', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.getOne = async (req, res, next) => { try { const d = await PaymentMade.findOne({ _id: req.params.id, ...userFilter(req) }).populate('bill', 'billNumber total vendorName').populate('vendor', 'name email phone').populate('createdBy', 'name'); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, data: d }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
    try {
        const paymentNumber = await gen();
        const d = await PaymentMade.create({ ...req.body, paymentNumber, createdBy: req.user._id });
        if (req.body.bill) {
            const b = await Bill.findById(req.body.bill);
            if (b) { b.paidAmount = (b.paidAmount || 0) + d.amount; if (b.paidAmount >= b.total) b.status = 'paid'; else b.status = 'partial'; await b.save(); }
        }
        res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
};
exports.remove = async (req, res, next) => { try { const d = await PaymentMade.findOne({ _id: req.params.id, ...userFilter(req) }); if (!d) return res.status(404).json({ success: false, message: 'Not found' }); await d.deleteOne(); res.json({ success: true, message: 'Deleted' }); } catch (e) { next(e); } };
