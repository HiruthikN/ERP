const Employee = require('../models/Employee');

// @desc    Get all employees
exports.getEmployees = async (req, res, next) => {
    try {
        const { department, status, search } = req.query;
        let query = {};

        if (department) query.department = department;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const employees = await Employee.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: employees, count: employees.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single employee
exports.getEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Create employee
exports.createEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Update employee
exports.updateEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete employee
exports.deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
        next(error);
    }
};
