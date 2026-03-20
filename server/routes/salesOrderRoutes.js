const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/salesOrderController');

router.use(protect);
router.get('/', c.getSalesOrders);
router.get('/:id', c.getSalesOrder);
router.post('/', authorize('admin', 'sales'), c.createSalesOrder);
router.put('/:id', authorize('admin', 'sales'), c.updateSalesOrder);
router.delete('/:id', authorize('admin', 'sales'), c.deleteSalesOrder);
router.put('/:id/confirm', authorize('admin', 'sales'), c.confirmOrder);
router.put('/:id/cancel', authorize('admin', 'sales'), c.cancelOrder);
router.post('/:id/create-invoice', authorize('admin', 'sales'), c.createInvoice);
router.post('/:id/create-delivery', authorize('admin', 'sales'), c.createDeliveryNote);

module.exports = router;
