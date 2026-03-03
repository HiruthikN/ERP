const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getLeaves, deleteAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getAttendance);
router.get('/leaves', getLeaves);
router.post('/', authorize('admin', 'hr'), markAttendance);
router.delete('/:id', authorize('admin', 'hr'), deleteAttendance);

module.exports = router;
