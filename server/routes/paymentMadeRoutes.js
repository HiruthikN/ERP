const express = require('express');
const router = express.Router();
const c = require('../controllers/paymentMadeController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getOne).delete(c.remove);
module.exports = router;
