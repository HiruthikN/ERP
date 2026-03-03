const Attendance = require('../models/Attendance');

// @desc    Mark attendance
exports.markAttendance = async (req, res, next) => {
    try {
        const { employee, date, status, leaveType, checkIn, checkOut, notes } = req.body;

        // Check if attendance already marked for this employee on this date
        const existing = await Attendance.findOne({
            employee,
            date: new Date(date),
        });

        if (existing) {
            // Update existing
            const updated = await Attendance.findByIdAndUpdate(
                existing._id,
                { status, leaveType, checkIn, checkOut, notes },
                { new: true, runValidators: true }
            ).populate('employee', 'name department');
            return res.json({ success: true, data: updated, message: 'Attendance updated' });
        }

        const attendance = await Attendance.create({
            employee,
            date: new Date(date),
            status,
            leaveType: leaveType || 'none',
            checkIn,
            checkOut,
            notes,
        });

        const populated = await attendance.populate('employee', 'name department');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance records
exports.getAttendance = async (req, res, next) => {
    try {
        const { employee, startDate, endDate, status } = req.query;
        let query = {};

        if (employee) query.employee = employee;
        if (status) query.status = status;
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const attendance = await Attendance.find(query)
            .populate('employee', 'name department')
            .sort({ date: -1 });

        res.json({ success: true, data: attendance, count: attendance.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Get leave records
exports.getLeaves = async (req, res, next) => {
    try {
        const leaves = await Attendance.find({ status: 'leave' })
            .populate('employee', 'name department')
            .sort({ date: -1 });
        res.json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete attendance record
exports.deleteAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }
        res.json({ success: true, message: 'Attendance record deleted' });
    } catch (error) {
        next(error);
    }
};
