const Supplier = require('../models/Supplier');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

exports.getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find({ ...userFilter(req) }).sort({ name: 1 });
        res.json({ success: true, data: suppliers });
    } catch (error) { next(error); }
};

exports.getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, data: supplier });
    } catch (error) { next(error); }
};

exports.createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) { next(error); }
};

exports.updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, ...userFilter(req) },
            req.body,
            { new: true, runValidators: true }
        );
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, data: supplier });
    } catch (error) { next(error); }
};

exports.deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, ...userFilter(req) });
        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.json({ success: true, message: 'Supplier deleted' });
    } catch (error) { next(error); }
};
