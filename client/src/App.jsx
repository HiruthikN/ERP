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
import Sales from './pages/sales/Sales';
import Employees from './pages/hr/Employees';
import Attendance from './pages/hr/Attendance';
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
                            <Route path="inventory/products" element={<Products />} />
                            <Route path="inventory/categories" element={<Categories />} />
                            <Route path="inventory/suppliers" element={<Suppliers />} />
                            <Route path="sales" element={<Sales />} />
                            <Route path="hr/employees" element={<Employees />} />
                            <Route path="hr/attendance" element={<Attendance />} />
                            <Route path="reports" element={<Reports />} />
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
