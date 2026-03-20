const Product = require('../models/Product');

// Helper: clean empty ObjectId fields to prevent BSONError
const cleanBody = (body) => {
    const cleaned = { ...body };
    if (!cleaned.supplier || cleaned.supplier === '') delete cleaned.supplier;
    if (!cleaned.category || cleaned.category === '') delete cleaned.category;
    return cleaned;
};

// Helper: user-scoped filter (admin sees all)
const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

// @desc    Get all products with search/filter
exports.getProducts = async (req, res, next) => {
    try {
        const { search, category, supplier, lowStock } = req.query;
        let query = { ...userFilter(req) };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
            ];
        }
        if (category) query.category = category;
        if (supplier) query.supplier = supplier;
        if (lowStock === 'true') {
            query.quantity = { $lte: 10 };
        }

        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: products, count: products.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, ...userFilter(req) })
            .populate('category', 'name')
            .populate('supplier', 'name');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product
exports.createProduct = async (req, res, next) => {
    try {
        const product = await Product.create({ ...cleanBody(req.body), createdBy: req.user._id });
        const populated = await product.populate([
            { path: 'category', select: 'name' },
            { path: 'supplier', select: 'name' },
        ]);
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
exports.updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, ...userFilter(req) },
            cleanBody(req.body),
            { new: true, runValidators: true }
        )
            .populate('category', 'name')
            .populate('supplier', 'name');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, ...userFilter(req) });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock products
exports.getLowStock = async (req, res, next) => {
    try {
        const products = await Product.find({
            ...userFilter(req),
            quantity: { $lte: 10 },
        })
            .populate('category', 'name')
            .sort({ quantity: 1 });
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};
