const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('admin', 'sales'), createCategory);
router.put('/:id', authorize('admin', 'sales'), updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);

module.exports = router;
