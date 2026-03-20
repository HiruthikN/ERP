const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getPayrolls,
    getPayroll,
    generatePayroll,
    updatePayroll,
    processPayroll,
    payPayroll,
    deletePayroll,
    getPayrollSummary,
} = require('../controllers/payrollController');

router.use(protect);

router.route('/').get(getPayrolls);
router.route('/generate').post(generatePayroll);
router.route('/summary').get(getPayrollSummary);
router.route('/:id').get(getPayroll).put(updatePayroll).delete(deletePayroll);
router.route('/:id/process').put(processPayroll);
router.route('/:id/pay').put(payPayroll);

module.exports = router;
