import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../../utils/api';
import { FiDownload, FiTrendingUp, FiPackage, FiUsers, FiDollarSign } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [period, setPeriod] = useState('daily');
    const [salesReport, setSalesReport] = useState([]);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [employeeReport, setEmployeeReport] = useState(null);
    const [profitReport, setProfitReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchReport(); }, [activeTab, period]);

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
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const exportCSV = async (type) => {
        try {
            const res = await api.get(`/dashboard/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error(err); }
    };

    const salesChartData = {
        labels: salesReport.map(d => d._id),
        datasets: [{
            label: 'Revenue',
            data: salesReport.map(d => d.revenue),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderRadius: 6,
        }],
    };

    const deptChartData = employeeReport ? {
        labels: employeeReport.departmentStats.map(d => d._id),
        datasets: [{
            label: 'Employees',
            data: employeeReport.departmentStats.map(d => d.count),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
            borderRadius: 6,
        }],
    } : null;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Reports & Analytics</h1>
            </div>

            <div className="tabs">
                <button className={`tab ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}><FiTrendingUp /> Sales</button>
                <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><FiPackage /> Inventory</button>
                <button className={`tab ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}><FiUsers /> Employees</button>
                <button className={`tab ${activeTab === 'profit' ? 'active' : ''}`} onClick={() => setActiveTab('profit')}><FiDollarSign /> Profit</button>
            </div>

            {loading && <div className="loading-screen"><div className="spinner"></div></div>}

            {!loading && activeTab === 'sales' && (
                <div>
                    <div className="report-controls">
                        <div className="period-selector">
                            <button className={period === 'daily' ? 'active' : ''} onClick={() => setPeriod('daily')}>Daily</button>
                            <button className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>Weekly</button>
                            <button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
                        </div>
                        <button className="btn btn-secondary" onClick={() => exportCSV('sales')}><FiDownload /> Export CSV</button>
                    </div>
                    <div className="chart-card"><div className="chart-wrapper"><Bar data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Period</th><th>Total Sales</th><th>Revenue</th><th>Avg Order Value</th></tr></thead>
                            <tbody>
                                {salesReport.map(r => (
                                    <tr key={r._id}>
                                        <td>{r._id}</td><td>{r.totalSales}</td>
                                        <td>₹{r.revenue.toLocaleString()}</td><td>₹{(r.avgOrderValue || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'inventory' && inventoryReport && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card stat-blue"><div className="stat-icon"><FiPackage /></div><div className="stat-info"><span className="stat-value">{inventoryReport.summary.totalProducts}</span><span className="stat-label">Products</span></div></div>
                        <div className="stat-card stat-green"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{inventoryReport.summary.totalValue.toLocaleString()}</span><span className="stat-label">Total Value</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-info"><span className="stat-value">₹{inventoryReport.summary.potentialProfit.toLocaleString()}</span><span className="stat-label">Potential Profit</span></div></div>
                    </div>
                    <div className="report-controls">
                        <div></div>
                        <button className="btn btn-secondary" onClick={() => exportCSV('inventory')}><FiDownload /> Export CSV</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Value</th></tr></thead>
                            <tbody>
                                {inventoryReport.products.map(p => (
                                    <tr key={p._id}>
                                        <td><strong>{p.name}</strong></td><td><code>{p.sku}</code></td><td>{p.category?.name}</td>
                                        <td>₹{p.price.toLocaleString()}</td><td>₹{p.cost.toLocaleString()}</td><td>{p.quantity}</td><td>₹{(p.price * p.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'employees' && employeeReport && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card stat-teal"><div className="stat-icon"><FiUsers /></div><div className="stat-info"><span className="stat-value">{employeeReport.summary.totalEmployees}</span><span className="stat-label">Total Employees</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{employeeReport.summary.totalSalaryExpense.toLocaleString()}</span><span className="stat-label">Total Salary</span></div></div>
                    </div>
                    <div className="report-controls">
                        <div></div>
                        <button className="btn btn-secondary" onClick={() => exportCSV('employees')}><FiDownload /> Export CSV</button>
                    </div>
                    {deptChartData && <div className="chart-card"><h3>Employees by Department</h3><div className="chart-wrapper"><Bar data={deptChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>}
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Department</th><th>Headcount</th><th>Total Salary</th><th>Avg Salary</th></tr></thead>
                            <tbody>
                                {employeeReport.departmentStats.map(d => (
                                    <tr key={d._id}>
                                        <td><strong>{d._id}</strong></td><td>{d.count}</td>
                                        <td>₹{d.totalSalary.toLocaleString()}</td><td>₹{d.avgSalary.toFixed(0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'profit' && profitReport && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card stat-green"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{profitReport.totalRevenue.toLocaleString()}</span><span className="stat-label">Total Revenue</span></div></div>
                        <div className="stat-card stat-yellow"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-info"><span className="stat-value">₹{profitReport.totalCost.toLocaleString()}</span><span className="stat-label">Total Cost</span></div></div>
                        <div className="stat-card stat-purple"><div className="stat-icon"><FiDollarSign /></div><div className="stat-info"><span className="stat-value">₹{profitReport.grossProfit.toLocaleString()}</span><span className="stat-label">Gross Profit</span></div></div>
                        <div className="stat-card stat-teal"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-info"><span className="stat-value">{profitReport.profitMargin}%</span><span className="stat-label">Profit Margin</span></div></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
