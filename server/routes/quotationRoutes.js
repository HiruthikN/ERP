const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/quotationController');

router.use(protect);
router.get('/', c.getQuotations);
router.get('/:id', c.getQuotation);
router.post('/', authorize('admin', 'sales'), c.createQuotation);
router.put('/:id', authorize('admin', 'sales'), c.updateQuotation);
router.delete('/:id', authorize('admin', 'sales'), c.deleteQuotation);
router.put('/:id/send', authorize('admin', 'sales'), c.sendQuotation);
router.put('/:id/approve', authorize('admin', 'sales'), c.approveQuotation);
router.put('/:id/reject', authorize('admin', 'sales'), c.rejectQuotation);
router.post('/:id/convert-to-order', authorize('admin', 'sales'), c.convertToOrder);

module.exports = router;
