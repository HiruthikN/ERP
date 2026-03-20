import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    FiDownload, FiTrendingUp, FiPackage, FiUsers, FiDollarSign,
    FiCalendar, FiCreditCard, FiFileText, FiShoppingCart, FiTruck, FiPercent
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

// Role-based tab access mapping
const ROLE_TABS = {
    admin: ['sales', 'inventory', 'employees', 'profit', 'payroll', 'attendance', 'quotations', 'orders', 'deliveries', 'credits'],
    hr: ['employees', 'payroll', 'attendance'],
    sales: ['sales', 'inventory', 'quotations', 'orders', 'deliveries', 'credits'],
};

const Reports = () => {
    const { user } = useAuth();
    const allowedTabs = ROLE_TABS[user?.role] || ROLE_TABS.sales;
    const now = new Date();
    const [activeTab, setActiveTab] = useState(allowedTabs[0]);
    const [period, setPeriod] = useState('daily');
    const [salesReport, setSalesReport] = useState([]);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [employeeReport, setEmployeeReport] = useState(null);
    const [profitReport, setProfitReport] = useState(null);
    const [payrollReport, setPayrollReport] = useState([]);
    const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
    const [payrollYear, setPayrollYear] = useState(now.getFullYear());
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [quotationReport, setQuotationReport] = useState([]);
    const [orderReport, setOrderReport] = useState([]);
    const [deliveryReport, setDeliveryReport] = useState([]);
    const [creditReport, setCreditReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchReport(); }, [activeTab, period, payrollMonth, payrollYear]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            if (activeTab === 'sales') {
                const res = await api.get(`/dashboard/sales-report?period=${period}`);
                setSalesReport(res.data.data);
            } else if (activeTab === 'inventory') {
                const res = await api.get('/dashboard/inventory-report');
                setInventoryReport(res.data.data);
            } else if (activeTab === 'employees') {
                const res = await api.get('/dashboard/employee-report');
                setEmployeeReport(res.data.data);
            } else if (activeTab === 'profit') {
                const res = await api.get('/dashboard/profit-report');
                setProfitReport(res.data.data);
            } else if (activeTab === 'payroll') {
                const res = await api.get(`/payroll?month=${payrollMonth}&year=${payrollYear}`);
                setPayrollReport(res.data.data);
            } else if (activeTab === 'attendance') {
                const res = await api.get('/attendance');
                setAttendanceReport(res.data.data);
            } else if (activeTab === 'quotations') {
                const res = await api.get('/quotations');
                setQuotationReport(res.data.data);
            } else if (activeTab === 'orders') {
                const res = await api.get('/sales-orders');
                setOrderReport(res.data.data);
            } else if (activeTab === 'deliveries') {
                const res = await api.get('/delivery-notes');
                setDeliveryReport(res.data.data);
            } else if (activeTab === 'credits') {
                const res = await api.get('/credit-notes');
                setCreditReport(res.data.data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const exportCSV = async (type) => {
        try {
            const res = await api.get(`/dashboard/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url; a.download = `${type}-report.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) { console.error(err); alert('Export failed'); }
    };

    const downloadCSV = (filename, headers, rows) => {
        const csv = headers + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        window.URL.revokeObjectURL(url);
    };

    const bulkDownloadAll = async () => {
        for (const type of ['sales', 'inventory', 'employees', 'payroll', 'attendance']) {
            await exportCSV(type);
            await new Promise(r => setTimeout(r, 500));
        }
    };

    // Summary helpers
    const payrollTotalNet = payrollReport.reduce((s, p) => s + p.netSalary, 0);
    const payrollPaid = payrollReport.filter(p => p.status === 'paid').length;

    const salesChartData = {
        labels: salesReport.map(d => d._id),
        datasets: [{ label: 'Revenue', data: salesReport.map(d => d.revenue), backgroundColor: 'rgba(99, 102, 241, 0.7)', borderRadius: 6 }],
    };

    const deptChartData = employeeReport ? {
        labels: employeeReport.departmentStats.map(d => d._id),
        datasets: [{ label: 'Employees', data: employeeReport.departmentStats.map(d => d.count), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'], borderRadius: 6 }],
    } : null;

    const payrollChartData = payrollReport.length > 0 ? {
        labels: payrollReport.map(p => p.employee?.name || 'N/A'),
        datasets: [
            { label: 'Net Salary', data: payrollReport.map(p => p.netSalary), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 6 },
            { label: 'Deductions', data: payrollReport.map(p => p.totalDeductions), backgroundColor: 'rgba(239, 68, 68, 0.5)', borderRadius: 6 },
        ],
    } : null;

    const statusBadge = (s) => {
        const map = {
            paid: 'badge-success', processed: 'badge-warning', draft: 'badge-info', sent: 'badge-info',
            approved: 'badge-success', rejected: 'badge-danger', confirmed: 'badge-warning', invoiced: 'badge-success',
            cancelled: 'badge-danger', pending: 'badge-warning', shipped: 'badge-info', delivered: 'badge-success',
            issued: 'badge-warning', applied: 'badge-success', expired: 'badge-danger', present: 'badge-success',
            absent: 'badge-danger', leave: 'badge-warning', 'half-day': 'badge-info'
        };
        return <span className={`badge ${map[s] || ''}`}>{s?.toUpperCase()}</span>;
    };

    const tabs = [
        { key: 'sales', icon: <FiTrendingUp />, label: 'Sales' },
        { key: 'inventory', icon: <FiPackage />, label: 'Inventory' },
        { key: 'employees', icon: <FiUsers />, label: 'Employees' },
        { key: 'profit', icon: <FiDollarSign />, label: 'Profit' },
        { key: 'payroll', icon: <FiCreditCard />, label: 'Payroll' },
        { key: 'attendance', icon: <FiCalendar />, label: 'Attendance' },
        { key: 'quotations', icon: <FiFileText />, label: 'Quotations' },
        { key: 'orders', icon: <FiShoppingCart />, label: 'Orders' },
        { key: 'deliveries', icon: <FiTruck />, label: 'Deliveries' },
        { key: 'credits', icon: <FiPercent />, label: 'Credit Notes' },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Reports & Analytics</h1><p>Download and analyze all business data</p></div>
                {user?.role === 'admin' && <button className="btn btn-primary" onClick={bulkDownloadAll}><FiDownload /> Download All</button>}
            </div>

            <div className="tabs" style={{ flexWrap: 'wrap' }}>
                {tabs.filter(t => allowedTabs.includes(t.key)).map(t => (
                    <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {loading && <div className="loading-screen"><div className="spinner"></div></div>}

            {/* ===== SALES ===== */}
            {!loading && activeTab === 'sales' && (
                <div className="animate-fade">
                    <div className="report-controls">
                        <div className="period-selector">
                            {['daily', 'weekly', 'monthly'].map(p => <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>)}
                        </div>
                        <button className="btn btn-secondary" onClick={() => exportCSV('sales')}><FiDownload /> Export CSV</button>
                    </div>
                    <div className="chart-card"><div className="chart-wrapper"><Bar data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Period</th><th>Total Sales</th><th>Revenue</th><th>Avg Order</th></tr></thead>
                        <tbody>{salesReport.map(r => <tr key={r._id}><td>{r._id}</td><td>{r.totalSales}</td><td>₹{r.revenue.toLocaleString()}</td><td>₹{(r.avgOrderValue || 0).toFixed(2)}</td></tr>)}</tbody>
                    </table></div>
                </div>
            )}

            {/* ===== INVENTORY ===== */}
            {!loading && activeTab === 'inventory' && inventoryReport && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiPackage /></div><div className="stat-info"><span className="stat-value">{inventoryReport.summary.totalProducts}</span><span className="stat-label">Products</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{inventoryReport.summary.totalValue.toLocaleString()}</span><span className="stat-label">Total Value</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-info"><span className="stat-value">₹{inventoryReport.summary.potentialProfit.toLocaleString()}</span><span className="stat-label">Potential Profit</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => exportCSV('inventory')}><FiDownload /> Export CSV</button></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Value</th></tr></thead>
                        <tbody>{inventoryReport.products.map(p => <tr key={p._id}><td><strong>{p.name}</strong></td><td><code>{p.sku}</code></td><td>{p.category?.name}</td><td>₹{p.price.toLocaleString()}</td><td>₹{p.cost.toLocaleString()}</td><td>{p.quantity}</td><td>₹{(p.price * p.quantity).toLocaleString()}</td></tr>)}</tbody>
                    </table></div>
                </div>
            )}

            {/* ===== EMPLOYEES ===== */}
            {!loading && activeTab === 'employees' && employeeReport && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-teal"><div className="stat-icon"><FiUsers /></div><div className="stat-info"><span className="stat-value">{employeeReport.summary.totalEmployees}</span><span className="stat-label">Total Employees</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{employeeReport.summary.totalSalaryExpense.toLocaleString()}</span><span className="stat-label">Total Salary</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => exportCSV('employees')}><FiDownload /> Export CSV</button></div>
                    {deptChartData && <div className="chart-card"><h3>Employees by Department</h3><div className="chart-wrapper"><Bar data={deptChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>}
                    <div className="table-container"><table>
                        <thead><tr><th>Department</th><th>Headcount</th><th>Total Salary</th><th>Avg Salary</th></tr></thead>
                        <tbody>{employeeReport.departmentStats.map(d => <tr key={d._id}><td><strong>{d._id}</strong></td><td>{d.count}</td><td>₹{d.totalSalary.toLocaleString()}</td><td>₹{d.avgSalary.toFixed(0).toLocaleString()}</td></tr>)}</tbody>
                    </table></div>
                </div>
            )}

            {/* ===== PROFIT ===== */}
            {!loading && activeTab === 'profit' && profitReport && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-green"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{profitReport.totalRevenue.toLocaleString()}</span><span className="stat-label">Revenue</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-info"><span className="stat-value">₹{profitReport.totalCost.toLocaleString()}</span><span className="stat-label">Cost</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{profitReport.grossProfit.toLocaleString()}</span><span className="stat-label">Gross Profit</span></div></div>
                        <div className="stat-card stat-teal"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-info"><span className="stat-value">{profitReport.profitMargin}%</span><span className="stat-label">Margin</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => downloadCSV('profit-report.csv', 'Revenue,Cost,Profit,Margin', [`${profitReport.totalRevenue},${profitReport.totalCost},${profitReport.grossProfit},${profitReport.profitMargin}%`])}><FiDownload /> Export CSV</button></div>
                </div>
            )}

            {/* ===== PAYROLL ===== */}
            {!loading && activeTab === 'payroll' && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiUsers /></div><div className="stat-info"><span className="stat-value">{payrollReport.length}</span><span className="stat-label">Records</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiCreditCard /></div><div className="stat-info"><span className="stat-value">₹{payrollTotalNet.toLocaleString()}</span><span className="stat-label">Net Payout</span></div></div>
                        <div className="stat-card stat-teal"><div className="stat-icon"><FiFileText /></div><div className="stat-info"><span className="stat-value">{payrollPaid}/{payrollReport.length}</span><span className="stat-label">Paid</span></div></div>
                    </div>
                    <div className="report-controls">
                        <div className="payroll-period-selectors">
                            <select value={payrollMonth} onChange={e => setPayrollMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
                            <select value={payrollYear} onChange={e => setPayrollYear(Number(e.target.value))}>{[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}</select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => exportCSV('payroll')}><FiDownload /> Full CSV</button>
                            <button className="btn btn-secondary" onClick={() => downloadCSV(`payroll-${MONTHS[payrollMonth - 1]}-${payrollYear}.csv`, 'Employee,Dept,Base,Allowances,Deductions,Net,Status', payrollReport.map(p => `${p.employee?.name},${p.employee?.department},${p.baseSalary},${p.totalAllowances},${p.totalDeductions},${p.netSalary},${p.status}`))}><FiDownload /> Monthly</button>
                        </div>
                    </div>
                    {payrollChartData && <div className="chart-card"><h3>Payroll — {MONTHS[payrollMonth - 1]} {payrollYear}</h3><div className="chart-wrapper"><Bar data={payrollChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} /></div></div>}
                    <div className="table-container"><table>
                        <thead><tr><th>Employee</th><th>Dept</th><th>Base</th><th>Allowances</th><th>Deductions</th><th>Net</th><th>Status</th></tr></thead>
                        <tbody>{payrollReport.map(p => <tr key={p._id}><td><strong>{p.employee?.name}</strong></td><td>{p.employee?.department}</td><td>₹{p.baseSalary.toLocaleString()}</td><td style={{ color: 'var(--success)' }}>+₹{p.totalAllowances.toLocaleString()}</td><td style={{ color: 'var(--danger)' }}>-₹{p.totalDeductions.toLocaleString()}</td><td><strong>₹{p.netSalary.toLocaleString()}</strong></td><td>{statusBadge(p.status)}</td></tr>)}</tbody>
                    </table>{payrollReport.length === 0 && <div className="empty-state">No payroll for this period</div>}</div>
                </div>
            )}

            {/* ===== ATTENDANCE ===== */}
            {!loading && activeTab === 'attendance' && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiCalendar /></div><div className="stat-info"><span className="stat-value">{attendanceReport.length}</span><span className="stat-label">Records</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiUsers /></div><div className="stat-info"><span className="stat-value">{attendanceReport.filter(a => a.status === 'present').length}</span><span className="stat-label">Present</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiUsers /></div><div className="stat-info"><span className="stat-value">{attendanceReport.filter(a => a.status === 'absent').length}</span><span className="stat-label">Absent</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiUsers /></div><div className="stat-info"><span className="stat-value">{attendanceReport.filter(a => a.status === 'leave').length}</span><span className="stat-label">On Leave</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => exportCSV('attendance')}><FiDownload /> Export CSV</button></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Employee</th><th>Dept</th><th>Date</th><th>Status</th><th>In</th><th>Out</th></tr></thead>
                        <tbody>{attendanceReport.slice(0, 50).map(a => <tr key={a._id}><td><strong>{a.employee?.name}</strong></td><td>{a.employee?.department}</td><td>{new Date(a.date).toLocaleDateString()}</td><td>{statusBadge(a.status)}</td><td>{a.checkIn || '—'}</td><td>{a.checkOut || '—'}</td></tr>)}</tbody>
                    </table>{attendanceReport.length === 0 && <div className="empty-state">No records</div>}{attendanceReport.length > 50 && <div className="empty-state">Showing 50/{attendanceReport.length}. Export for full data.</div>}</div>
                </div>
            )}

            {/* ===== QUOTATIONS ===== */}
            {!loading && activeTab === 'quotations' && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiFileText /></div><div className="stat-info"><span className="stat-value">{quotationReport.length}</span><span className="stat-label">Total</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiFileText /></div><div className="stat-info"><span className="stat-value">{quotationReport.filter(q => q.status === 'approved').length}</span><span className="stat-label">Approved</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiFileText /></div><div className="stat-info"><span className="stat-value">{quotationReport.filter(q => q.status === 'sent').length}</span><span className="stat-label">Pending</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{quotationReport.reduce((s, q) => s + q.total, 0).toLocaleString()}</span><span className="stat-label">Total Value</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => downloadCSV('quotations-report.csv', 'Number,Customer,Items,Total,Status,Date', quotationReport.map(q => `${q.quotationNumber},${q.customerName},${q.items.length},${q.total},${q.status},${new Date(q.createdAt).toLocaleDateString()}`))}><FiDownload /> Export CSV</button></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Number</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>{quotationReport.map(q => <tr key={q._id}><td><strong>{q.quotationNumber}</strong></td><td>{q.customerName}</td><td>{q.items.length}</td><td>₹{q.total.toLocaleString()}</td><td>{statusBadge(q.status)}</td><td>{new Date(q.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
                    </table>{quotationReport.length === 0 && <div className="empty-state">No quotations</div>}</div>
                </div>
            )}

            {/* ===== ORDERS ===== */}
            {!loading && activeTab === 'orders' && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiShoppingCart /></div><div className="stat-info"><span className="stat-value">{orderReport.length}</span><span className="stat-label">Total</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiShoppingCart /></div><div className="stat-info"><span className="stat-value">{orderReport.filter(o => o.status === 'invoiced').length}</span><span className="stat-label">Invoiced</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiShoppingCart /></div><div className="stat-info"><span className="stat-value">{orderReport.filter(o => o.status === 'confirmed').length}</span><span className="stat-label">Confirmed</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{orderReport.reduce((s, o) => s + o.total, 0).toLocaleString()}</span><span className="stat-label">Total Value</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => downloadCSV('orders-report.csv', 'Order#,From Quotation,Customer,Items,Total,Status,Date', orderReport.map(o => `${o.orderNumber},${o.quotation?.quotationNumber || 'N/A'},${o.customerName},${o.items.length},${o.total},${o.status},${new Date(o.createdAt).toLocaleDateString()}`))}><FiDownload /> Export CSV</button></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>{orderReport.map(o => <tr key={o._id}><td><strong>{o.orderNumber}</strong></td><td>{o.customerName}</td><td>{o.items.length}</td><td>₹{o.total.toLocaleString()}</td><td>{statusBadge(o.status)}</td><td>{new Date(o.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
                    </table>{orderReport.length === 0 && <div className="empty-state">No orders</div>}</div>
                </div>
            )}

            {/* ===== DELIVERIES ===== */}
            {!loading && activeTab === 'deliveries' && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiTruck /></div><div className="stat-info"><span className="stat-value">{deliveryReport.length}</span><span className="stat-label">Total</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiTruck /></div><div className="stat-info"><span className="stat-value">{deliveryReport.filter(d => d.status === 'delivered').length}</span><span className="stat-label">Delivered</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiTruck /></div><div className="stat-info"><span className="stat-value">{deliveryReport.filter(d => d.status === 'shipped').length}</span><span className="stat-label">Shipped</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiTruck /></div><div className="stat-info"><span className="stat-value">{deliveryReport.filter(d => d.status === 'pending').length}</span><span className="stat-label">Pending</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => downloadCSV('deliveries-report.csv', 'Delivery#,Order#,Customer,Items,Status,Date', deliveryReport.map(d => `${d.deliveryNumber},${d.salesOrder?.orderNumber || ''},${d.customerName},${d.items.length},${d.status},${new Date(d.deliveryDate).toLocaleDateString()}`))}><FiDownload /> Export CSV</button></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Delivery #</th><th>Order #</th><th>Customer</th><th>Items</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>{deliveryReport.map(d => <tr key={d._id}><td><strong>{d.deliveryNumber}</strong></td><td>{d.salesOrder?.orderNumber || '—'}</td><td>{d.customerName}</td><td>{d.items.length}</td><td>{statusBadge(d.status)}</td><td>{new Date(d.deliveryDate).toLocaleDateString()}</td></tr>)}</tbody>
                    </table>{deliveryReport.length === 0 && <div className="empty-state">No delivery notes</div>}</div>
                </div>
            )}

            {/* ===== CREDIT NOTES ===== */}
            {!loading && activeTab === 'credits' && (
                <div className="animate-fade">
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiCreditCard /></div><div className="stat-info"><span className="stat-value">{creditReport.length}</span><span className="stat-label">Total</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiCreditCard /></div><div className="stat-info"><span className="stat-value">{creditReport.filter(c => c.status === 'applied').length}</span><span className="stat-label">Applied</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiCreditCard /></div><div className="stat-info"><span className="stat-value">{creditReport.filter(c => c.status === 'issued').length}</span><span className="stat-label">Issued</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{creditReport.reduce((s, c) => s + c.total, 0).toLocaleString()}</span><span className="stat-label">Total Value</span></div></div>
                    </div>
                    <div className="report-controls"><div></div><button className="btn btn-secondary" onClick={() => downloadCSV('credit-notes-report.csv', 'Credit#,Invoice,Customer,Reason,Total,Status,Date', creditReport.map(c => `${c.creditNumber},${c.invoice?.invoiceNumber || ''},${c.customerName},${c.reason},${c.total},${c.status},${new Date(c.createdAt).toLocaleDateString()}`))}><FiDownload /> Export CSV</button></div>
                    <div className="table-container"><table>
                        <thead><tr><th>Credit #</th><th>Invoice</th><th>Customer</th><th>Reason</th><th>Total</th><th>Status</th></tr></thead>
                        <tbody>{creditReport.map(c => <tr key={c._id}><td><strong>{c.creditNumber}</strong></td><td>{c.invoice?.invoiceNumber || '—'}</td><td>{c.customerName}</td><td>{c.reason}</td><td>₹{c.total.toLocaleString()}</td><td>{statusBadge(c.status)}</td></tr>)}</tbody>
                    </table>{creditReport.length === 0 && <div className="empty-state">No credit notes</div>}</div>
                </div>
            )}
        </div>
    );
};

export default Reports;
