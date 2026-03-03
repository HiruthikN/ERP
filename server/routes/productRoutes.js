const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStock } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/low-stock', getLowStock);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authorize('admin', 'sales'), createProduct);
router.put('/:id', authorize('admin', 'sales'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
