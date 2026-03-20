const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/creditNoteController');

router.use(protect);
router.get('/', c.getCreditNotes);
router.get('/:id', c.getCreditNote);
router.post('/', authorize('admin', 'sales'), c.createCreditNote);
router.delete('/:id', authorize('admin', 'sales'), c.deleteCreditNote);
router.put('/:id/issue', authorize('admin', 'sales'), c.issueCreditNote);
router.put('/:id/apply', authorize('admin', 'sales'), c.applyCreditNote);

module.exports = router;
