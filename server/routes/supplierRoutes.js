const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getSuppliers);
router.post('/', authorize('admin', 'sales'), createSupplier);
router.put('/:id', authorize('admin', 'sales'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;
