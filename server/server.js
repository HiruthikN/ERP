const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env variables from root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/sales-orders', require('./routes/salesOrderRoutes'));
app.use('/api/delivery-notes', require('./routes/deliveryNoteRoutes'));
app.use('/api/credit-notes', require('./routes/creditNoteRoutes'));
app.use('/api/pricing-rules', require('./routes/pricingRoutes'));

// Sales module — new
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/retainer-invoices', require('./routes/retainerInvoiceRoutes'));
app.use('/api/payments-received', require('./routes/paymentReceivedRoutes'));
app.use('/api/recurring-invoices', require('./routes/recurringInvoiceRoutes'));

// Purchase module
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/recurring-expenses', require('./routes/recurringExpenseRoutes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/payments-made', require('./routes/paymentMadeRoutes'));
app.use('/api/recurring-bills', require('./routes/recurringBillRoutes'));
app.use('/api/vendor-credits', require('./routes/vendorCreditRoutes'));

app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ERP API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 ERP Server running on http://localhost:${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health\n`);
});
