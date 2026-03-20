import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/inventory/Products';
import Categories from './pages/inventory/Categories';
import Suppliers from './pages/inventory/Suppliers';
// Sales module
import Customers from './pages/sales/Customers';
import Quotations from './pages/sales/Quotations';
import RetainerInvoices from './pages/sales/RetainerInvoices';
import SalesOrders from './pages/sales/SalesOrders';
import DeliveryNotes from './pages/sales/DeliveryNotes';
import Sales from './pages/sales/Sales';
import PaymentsReceived from './pages/sales/PaymentsReceived';
import RecurringInvoices from './pages/sales/RecurringInvoices';
import CreditNotes from './pages/sales/CreditNotes';
// Purchase module
import Vendors from './pages/purchases/Vendors';
import Expenses from './pages/purchases/Expenses';
import RecurringExpenses from './pages/purchases/RecurringExpenses';
import PurchaseOrders from './pages/purchases/PurchaseOrders';
import Bills from './pages/purchases/Bills';
import PaymentsMade from './pages/purchases/PaymentsMade';
import RecurringBills from './pages/purchases/RecurringBills';
import VendorCredits from './pages/purchases/VendorCredits';
// HR
import Employees from './pages/hr/Employees';
import Attendance from './pages/hr/Attendance';
import Payroll from './pages/hr/Payroll';
import Reports from './pages/reports/Reports';
import Profile from './pages/Profile';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            {/* Inventory — admin, sales */}
                            <Route path="inventory/products" element={<ProtectedRoute roles={['admin', 'sales']}><Products /></ProtectedRoute>} />
                            <Route path="inventory/categories" element={<ProtectedRoute roles={['admin', 'sales']}><Categories /></ProtectedRoute>} />
                            <Route path="inventory/suppliers" element={<ProtectedRoute roles={['admin', 'sales']}><Suppliers /></ProtectedRoute>} />
                            {/* Sales — admin, sales */}
                            <Route path="sales/customers" element={<ProtectedRoute roles={['admin', 'sales']}><Customers /></ProtectedRoute>} />
                            <Route path="sales/estimates" element={<ProtectedRoute roles={['admin', 'sales']}><Quotations /></ProtectedRoute>} />
                            <Route path="sales/retainer-invoices" element={<ProtectedRoute roles={['admin', 'sales']}><RetainerInvoices /></ProtectedRoute>} />
                            <Route path="sales/orders" element={<ProtectedRoute roles={['admin', 'sales']}><SalesOrders /></ProtectedRoute>} />
                            <Route path="sales/delivery-challans" element={<ProtectedRoute roles={['admin', 'sales']}><DeliveryNotes /></ProtectedRoute>} />
                            <Route path="sales/invoices" element={<ProtectedRoute roles={['admin', 'sales']}><Sales /></ProtectedRoute>} />
                            <Route path="sales/payments-received" element={<ProtectedRoute roles={['admin', 'sales']}><PaymentsReceived /></ProtectedRoute>} />
                            <Route path="sales/recurring-invoices" element={<ProtectedRoute roles={['admin', 'sales']}><RecurringInvoices /></ProtectedRoute>} />
                            <Route path="sales/credit-notes" element={<ProtectedRoute roles={['admin', 'sales']}><CreditNotes /></ProtectedRoute>} />
                            {/* Purchases — admin, sales */}
                            <Route path="purchases/vendors" element={<ProtectedRoute roles={['admin', 'sales']}><Vendors /></ProtectedRoute>} />
                            <Route path="purchases/expenses" element={<ProtectedRoute roles={['admin', 'sales']}><Expenses /></ProtectedRoute>} />
                            <Route path="purchases/recurring-expenses" element={<ProtectedRoute roles={['admin', 'sales']}><RecurringExpenses /></ProtectedRoute>} />
                            <Route path="purchases/purchase-orders" element={<ProtectedRoute roles={['admin', 'sales']}><PurchaseOrders /></ProtectedRoute>} />
                            <Route path="purchases/bills" element={<ProtectedRoute roles={['admin', 'sales']}><Bills /></ProtectedRoute>} />
                            <Route path="purchases/payments-made" element={<ProtectedRoute roles={['admin', 'sales']}><PaymentsMade /></ProtectedRoute>} />
                            <Route path="purchases/recurring-bills" element={<ProtectedRoute roles={['admin', 'sales']}><RecurringBills /></ProtectedRoute>} />
                            <Route path="purchases/vendor-credits" element={<ProtectedRoute roles={['admin', 'sales']}><VendorCredits /></ProtectedRoute>} />
                            {/* HR — admin, hr */}
                            <Route path="hr/employees" element={<ProtectedRoute roles={['admin', 'hr']}><Employees /></ProtectedRoute>} />
                            <Route path="hr/attendance" element={<ProtectedRoute roles={['admin', 'hr']}><Attendance /></ProtectedRoute>} />
                            <Route path="hr/payroll" element={<ProtectedRoute roles={['admin', 'hr']}><Payroll /></ProtectedRoute>} />
                            <Route path="reports" element={<ProtectedRoute roles={['admin', 'hr', 'sales']}><Reports /></ProtectedRoute>} />
                            <Route path="profile" element={<Profile />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
