const Customer = require('../models/Customer');

const userFilter = (req) => req.user.role === 'admin' ? {} : { createdBy: req.user._id };

exports.getCustomers = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { ...userFilter(req) };
        if (status) filter.status = status;
        const customers = await Customer.find(filter).sort({ name: 1 });
        res.json({ success: true, data: customers });
    } catch (err) { next(err); }
};

exports.getCustomer = async (req, res, next) => {
    try {
        const c = await Customer.findOne({ _id: req.params.id, ...userFilter(req) });
        if (!c) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: c });
    } catch (err) { next(err); }
};

exports.createCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, data: customer });
    } catch (err) { next(err); }
};

exports.updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, ...userFilter(req) },
            req.body,
            { new: true, runValidators: true }
        );
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        res.json({ success: true, data: customer });
    } catch (err) { next(err); }
};

exports.deleteCustomer = async (req, res, next) => {
    try {
        const c = await Customer.findOneAndDelete({ _id: req.params.id, ...userFilter(req) });
        if (!c) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Customer deleted' });
    } catch (err) { next(err); }
};
