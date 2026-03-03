const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
exports.getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find().sort({ name: 1 });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        next(error);
    }
};

// @desc    Create supplier
exports.createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// @desc    Update supplier
exports.updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        res.json({ success: true, data: supplier });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete supplier
exports.deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        res.json({ success: true, message: 'Supplier deleted' });
    } catch (error) {
        next(error);
    }
};
