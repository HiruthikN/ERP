const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/pricingController');

router.use(protect);
router.get('/', c.getPricingRules);
router.get('/applicable', c.getApplicableRules);
router.get('/:id', c.getPricingRule);
router.post('/', authorize('admin', 'sales'), c.createPricingRule);
router.put('/:id', authorize('admin', 'sales'), c.updatePricingRule);
router.delete('/:id', authorize('admin', 'sales'), c.deletePricingRule);
router.put('/:id/toggle', authorize('admin', 'sales'), c.togglePricingRule);

module.exports = router;
