const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesReport,
    getInventoryReport,
    getEmployeeReport,
    getProfitReport,
    exportCSV,
    getRecentSalesChart,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/sales-report', getSalesReport);
router.get('/inventory-report', getInventoryReport);
router.get('/employee-report', getEmployeeReport);
router.get('/profit-report', getProfitReport);
router.get('/chart/recent-sales', getRecentSalesChart);
router.get('/export/:type', exportCSV);

module.exports = router;
