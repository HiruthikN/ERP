const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'leave', 'half-day'],
            required: true,
        },
        leaveType: {
            type: String,
            enum: ['sick', 'casual', 'earned', 'unpaid', 'none'],
            default: 'none',
        },
        checkIn: {
            type: String,
            default: '',
        },
        checkOut: {
            type: String,
            default: '',
        },
        notes: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
