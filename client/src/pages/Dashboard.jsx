import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiDollarSign, FiShoppingCart, FiPackage, FiAlertTriangle, FiUsers, FiTrendingUp, FiPlus, FiFileText, FiUserPlus, FiCalendar } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [statsRes, chartRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/chart/recent-sales'),
            ]);
            setStats(statsRes.data.data);
            setChartData(chartRes.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading dashboard...</p></div>;

    const revenueChartData = {
        labels: chartData.map(d => d._id),
        datasets: [{
            label: 'Revenue (₹)',
            data: chartData.map(d => d.revenue),
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: '#6366f1',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 6,
        }],
    };

    const salesCountChart = {
        labels: chartData.map(d => d._id),
        datasets: [{
            label: 'Number of Sales',
            data: chartData.map(d => d.count),
            backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, '#10b981');
                gradient.addColorStop(1, '#059669');
                return gradient;
            },
            borderRadius: 8,
            borderSkipped: false,
        }],
    };

    const statusChart = {
        labels: ['Products', 'Low Stock', 'Employees'],
        datasets: [{
            data: [stats?.totalProducts || 0, stats?.lowStockProducts || 0, stats?.totalEmployees || 0],
            backgroundColor: ['#6366f1', '#f59e0b', '#10b981'],
            borderWidth: 0,
            spacing: 4,
            borderRadius: 4,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
            },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
    };

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="page-container">
            {/* Header with Greeting */}
            <div className="dashboard-header">
                <div>
                    <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
                    <p>Here's what's happening with your business today</p>
                </div>
                <div className="header-date">
                    <FiCalendar />
                    <span>{now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Quick Actions - NOW AT TOP */}
            <div className="quick-actions-top">
                <Link to="/sales?action=new" className="qa-card qa-purple">
                    <div className="qa-icon"><FiPlus /></div>
                    <div className="qa-text">
                        <span className="qa-title">New Sale</span>
                        <span className="qa-desc">Create invoice</span>
                    </div>
                </Link>
                <Link to="/inventory/products" className="qa-card qa-blue">
                    <div className="qa-icon"><FiPackage /></div>
                    <div className="qa-text">
                        <span className="qa-title">Add Product</span>
                        <span className="qa-desc">Manage inventory</span>
                    </div>
                </Link>
                <Link to="/hr/employees" className="qa-card qa-green">
                    <div className="qa-icon"><FiUserPlus /></div>
                    <div className="qa-text">
                        <span className="qa-title">Add Employee</span>
                        <span className="qa-desc">HR management</span>
                    </div>
                </Link>
                <Link to="/reports" className="qa-card qa-orange">
                    <div className="qa-icon"><FiFileText /></div>
                    <div className="qa-text">
                        <span className="qa-title">View Reports</span>
                        <span className="qa-desc">Analytics & exports</span>
                    </div>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-purple">
                    <div className="stat-icon"><FiShoppingCart /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.totalSales || 0}</span>
                        <span className="stat-label">Total Sales</span>
                    </div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-icon"><FiDollarSign /></div>
                    <div className="stat-info">
                        <span className="stat-value">₹{(stats?.totalRevenue || 0).toLocaleString()}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="stat-card stat-blue">
                    <div className="stat-icon"><FiPackage /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.totalProducts || 0}</span>
                        <span className="stat-label">Total Products</span>
                    </div>
                </div>
                <div className="stat-card stat-yellow">
                    <div className="stat-icon"><FiAlertTriangle /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.lowStockProducts || 0}</span>
                        <span className="stat-label">Low Stock</span>
                    </div>
                </div>
                <div className="stat-card stat-teal">
                    <div className="stat-icon"><FiUsers /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.totalEmployees || 0}</span>
                        <span className="stat-label">Employees</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3><FiTrendingUp /> Revenue Trend (30 Days)</h3>
                    <div className="chart-wrapper"><Line data={revenueChartData} options={chartOptions} /></div>
                </div>
                <div className="chart-card">
                    <h3><FiShoppingCart /> Sales Activity</h3>
                    <div className="chart-wrapper"><Bar data={salesCountChart} options={chartOptions} /></div>
                </div>
                <div className="chart-card chart-small">
                    <h3><FiPackage /> Business Overview</h3>
                    <div className="chart-wrapper chart-doughnut">
                        <Doughnut data={statusChart} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } } } }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
