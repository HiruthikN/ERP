const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale, updatePaymentStatus, getInvoicePDF } = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getSales);
router.get('/:id', getSale);
router.get('/:id/invoice-pdf', getInvoicePDF);
router.post('/', authorize('admin', 'sales'), createSale);
router.put('/:id/payment', authorize('admin', 'sales'), updatePaymentStatus);

module.exports = router;
