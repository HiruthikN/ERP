const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/deliveryNoteController');

router.use(protect);
router.get('/', c.getDeliveryNotes);
router.get('/:id', c.getDeliveryNote);
router.delete('/:id', authorize('admin', 'sales'), c.deleteDeliveryNote);
router.put('/:id/ship', authorize('admin', 'sales'), c.shipDelivery);
router.put('/:id/deliver', authorize('admin', 'sales'), c.deliverDelivery);

module.exports = router;
