const Category = require('../models/Category');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ ...userFilter(req) }).sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (error) { next(error); }
};

exports.getCategory = async (req, res, next) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: category });
    } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
    try {
        const category = await Category.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findOneAndUpdate(
            { _id: req.params.id, ...userFilter(req) },
            req.body,
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, data: category });
    } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findOneAndDelete({ _id: req.params.id, ...userFilter(req) });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) { next(error); }
};
