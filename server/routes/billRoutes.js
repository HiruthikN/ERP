const express = require('express');
const router = express.Router();
const c = require('../controllers/billController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getOne).put(c.update).delete(c.remove);
router.put('/:id/mark-received', c.markReceived);
module.exports = router;
