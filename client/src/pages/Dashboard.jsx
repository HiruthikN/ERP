import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    FiDollarSign, FiShoppingCart, FiPackage, FiAlertTriangle, FiUsers,
    FiTrendingUp, FiFileText, FiCalendar, FiTruck, FiCreditCard,
    FiArrowUpRight, FiArrowDownRight, FiShoppingBag, FiBarChart2,
    FiRefreshCw, FiPlus, FiActivity, FiPieChart, FiClipboard,
    FiGrid
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
        finally { setLoading(false); setRefreshing(false); }
    };

    const handleRefresh = () => { setRefreshing(true); fetchData(); };
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const textColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
    const fmtDate = (id) => { const p = id?.split('-'); return p?.length === 3 ? `${p[2]}/${p[1]}` : id; };

    /* ── Charts ── */
    const revenueLine = {
        labels: chartData.map(d => fmtDate(d._id)),
        datasets: [{
            data: chartData.map(d => d.revenue),
            backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
            borderColor: '#6366f1', borderWidth: 2, fill: true, tension: 0.4,
            pointRadius: 2, pointHoverRadius: 5,
            pointBackgroundColor: '#6366f1', pointBorderColor: isDark ? '#1e1e2e' : '#fff', pointBorderWidth: 1.5,
        }],
    };
    const salesBar = {
        labels: chartData.map(d => fmtDate(d._id)),
        datasets: [{
            data: chartData.map(d => d.count),
            backgroundColor: '#10b981', borderRadius: 4, borderSkipped: false,
            barThickness: 10, maxBarThickness: 16,
        }],
    };
    const splitDonut = {
        labels: ['Revenue', 'Expenses', 'Unpaid'],
        datasets: [{
            data: [stats?.totalRevenue || 0, stats?.totalExpenses || 0, stats?.unpaidBills || 0],
            backgroundColor: ['#6366f1', '#f43f5e', '#f59e0b'],
            borderWidth: 0, spacing: 3, hoverOffset: 4,
        }],
    };
    const axisOpts = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: isDark ? '#2a2a3d' : '#1e293b', padding: 8, cornerRadius: 6, titleFont: { size: 11 }, bodyFont: { size: 10 } } },
        scales: {
            y: { beginAtZero: true, grid: { color: gridColor, drawBorder: false }, ticks: { font: { size: 9 }, color: textColor, maxTicksLimit: 5 }, border: { display: false } },
            x: { grid: { display: false }, ticks: { font: { size: 9 }, color: textColor, maxRotation: 0 }, border: { display: false } },
        },
    };
    const donutOpts = {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
            legend: { position: 'right', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 10 }, color: textColor, boxWidth: 8 } },
            tooltip: { backgroundColor: isDark ? '#2a2a3d' : '#1e293b', padding: 8, cornerRadius: 6 },
        },
    };

    /* ── Alerts ── */
    const alerts = [];
    if (stats?.lowStockProducts > 0) alerts.push({ icon: FiAlertTriangle, text: `${stats.lowStockProducts} low stock items`, cls: 'warn', link: '/inventory/products' });
    if (stats?.pendingPayroll > 0) alerts.push({ icon: FiCreditCard, text: `₹${stats.pendingPayroll.toLocaleString()} payroll pending`, cls: 'danger', link: '/hr/payroll' });
    if (stats?.unpaidBills > 0) alerts.push({ icon: FiFileText, text: `₹${stats.unpaidBills.toLocaleString()} unpaid bills`, cls: 'warn', link: '/purchases/bills' });
    if (stats?.pendingDeliveries > 0) alerts.push({ icon: FiTruck, text: `${stats.pendingDeliveries} deliveries pending`, cls: 'info', link: '/sales/delivery-challans' });

    const Shimmer = ({ w = '100%', h = '14px' }) => <div className="d-shim" style={{ width: w, height: h }} />;
    const revenue = stats?.totalRevenue || 0;
    const expenses = stats?.totalExpenses || 0;
    const profit = revenue - expenses;

    return (
        <div className="d-wrap">
            {/* ─── Header ─── */}
            <header className="d-head">
                <div>
                    <h1 className="d-hi">{greeting}, <span>{user?.name?.split(' ')[0]}</span></h1>
                    <p className="d-date"><FiCalendar /> {now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <button className={`d-btn-icon ${refreshing ? 'spin' : ''}`} onClick={handleRefresh} title="Refresh"><FiRefreshCw /></button>
            </header>

            {/* ─── Quick Actions ─── */}
            <div className="d-qa-row">
                <Link to="/sales/invoices" className="d-qa d-qa-indigo">
                    <div className="d-qa-ic"><FiPlus /></div>
                    <span className="d-qa-txt">New Invoice</span>
                </Link>
                <Link to="/sales/estimates" className="d-qa d-qa-blue">
                    <div className="d-qa-ic"><FiClipboard /></div>
                    <span className="d-qa-txt">Estimate</span>
                </Link>
                <Link to="/sales/sales-orders" className="d-qa d-qa-cyan">
                    <div className="d-qa-ic"><FiShoppingCart /></div>
                    <span className="d-qa-txt">Sales Order</span>
                </Link>
                <Link to="/purchases/purchase-orders" className="d-qa d-qa-emerald">
                    <div className="d-qa-ic"><FiShoppingBag /></div>
                    <span className="d-qa-txt">Purchase</span>
                </Link>
                <Link to="/inventory/products" className="d-qa d-qa-amber">
                    <div className="d-qa-ic"><FiPackage /></div>
                    <span className="d-qa-txt">Products</span>
                </Link>
                <Link to="/reports" className="d-qa d-qa-rose">
                    <div className="d-qa-ic"><FiBarChart2 /></div>
                    <span className="d-qa-txt">Reports</span>
                </Link>
            </div>

            {/* ─── Colorful Metric Cards ─── */}
            <div className="d-metrics">
                <div className="d-metric d-gm-purple">
                    <div className="d-gm-glow" />
                    <div className="d-m-icon"><FiDollarSign /></div>
                    <div className="d-m-info">
                        <span className="d-m-label">Total Revenue</span>
                        <span className="d-m-val">₹{loading ? '---' : revenue.toLocaleString()}</span>
                    </div>
                </div>
                <div className="d-metric d-gm-blue">
                    <div className="d-gm-glow" />
                    <div className="d-m-icon"><FiFileText /></div>
                    <div className="d-m-info">
                        <span className="d-m-label">Invoices</span>
                        <span className="d-m-val">{loading ? '--' : stats?.totalSales || 0}</span>
                    </div>
                </div>
                <div className="d-metric d-gm-emerald">
                    <div className="d-gm-glow" />
                    <div className="d-m-icon"><FiShoppingCart /></div>
                    <div className="d-m-info">
                        <span className="d-m-label">Orders</span>
                        <span className="d-m-val">{loading ? '--' : stats?.totalOrders || 0} <small>({stats?.openOrders || 0} open)</small></span>
                    </div>
                </div>
                <div className="d-metric d-gm-teal">
                    <div className="d-gm-glow" />
                    <div className="d-m-icon"><FiPackage /></div>
                    <div className="d-m-info">
                        <span className="d-m-label">Products</span>
                        <span className="d-m-val">{loading ? '--' : stats?.totalProducts || 0}</span>
                    </div>
                </div>
                <div className="d-metric d-gm-rose">
                    <div className="d-gm-glow" />
                    <div className="d-m-icon"><FiTrendingUp /></div>
                    <div className="d-m-info">
                        <span className="d-m-label">Expenses</span>
                        <span className="d-m-val">₹{loading ? '---' : expenses.toLocaleString()}</span>
                    </div>
                </div>
                <div className="d-metric d-gm-amber">
                    <div className="d-gm-glow" />
                    <div className="d-m-icon"><FiUsers /></div>
                    <div className="d-m-info">
                        <span className="d-m-label">Customers</span>
                        <span className="d-m-val">{loading ? '--' : stats?.totalCustomers || 0}</span>
                    </div>
                </div>
            </div>

            {/* ─── Charts Row ─── */}
            <div className="d-cards-row">
                <div className="d-card">
                    <div className="d-card-head"><h3><FiTrendingUp /> Revenue Trend</h3><span className="d-tag">30d</span></div>
                    <div className="d-chart-sm">{loading ? <Shimmer w="100%" h="100%" /> : <Line data={revenueLine} options={axisOpts} />}</div>
                </div>
                <div className="d-card">
                    <div className="d-card-head"><h3><FiBarChart2 /> Sales Activity</h3><span className="d-tag">Daily</span></div>
                    <div className="d-chart-sm">{loading ? <Shimmer w="100%" h="100%" /> : <Bar data={salesBar} options={axisOpts} />}</div>
                </div>
                <div className="d-card">
                    <div className="d-card-head"><h3><FiPieChart /> Financial Split</h3></div>
                    <div className="d-chart-donut">{loading ? <Shimmer w="140px" h="140px" /> : <Doughnut data={splitDonut} options={donutOpts} />}</div>
                </div>
            </div>

            {/* ─── Bottom Row ─── */}
            <div className="d-cards-row d-bottom">
                <div className="d-card d-alerts-card">
                    <div className="d-card-head"><h3><FiActivity /> Alerts</h3>{alerts.length > 0 && <span className="d-dot">{alerts.length}</span>}</div>
                    {loading ? <div className="d-alert-list"><Shimmer h="34px" /><Shimmer h="34px" /></div> : alerts.length === 0 ? (
                        <p className="d-empty">✓ All clear — nothing pending</p>
                    ) : (
                        <div className="d-alert-list">
                            {alerts.map((a, i) => (
                                <Link key={i} to={a.link} className={`d-alert d-alert-${a.cls}`}>
                                    <a.icon /> <span>{a.text}</span> <FiArrowUpRight className="d-alert-go" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                <div className="d-card">
                    <div className="d-card-head"><h3><FiDollarSign /> Profit Overview</h3></div>
                    <div className="d-profit-row">
                        <div className="d-profit-item"><span className="d-profit-label">Income</span><span className="d-profit-val d-profit-green">₹{revenue.toLocaleString()}</span></div>
                        <div className="d-profit-item"><span className="d-profit-label">Expenses</span><span className="d-profit-val d-profit-red">₹{expenses.toLocaleString()}</span></div>
                        <div className="d-profit-item d-profit-highlight"><span className="d-profit-label">Net Profit</span><span className={`d-profit-val ${profit >= 0 ? 'd-profit-green' : 'd-profit-red'}`}>{profit >= 0 ? <FiArrowUpRight /> : <FiArrowDownRight />}₹{Math.abs(profit).toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="d-card">
                    <div className="d-card-head"><h3><FiGrid /> Quick Stats</h3></div>
                    <div className="d-qstats">
                        <div className="d-qs"><span className="d-qs-n">{loading ? '-' : stats?.totalQuotations || 0}</span><span className="d-qs-l">Quotes</span></div>
                        <div className="d-qs"><span className="d-qs-n">{loading ? '-' : stats?.totalDeliveries || 0}</span><span className="d-qs-l">Deliveries</span></div>
                        <div className="d-qs"><span className="d-qs-n">{loading ? '-' : stats?.totalCreditNotes || 0}</span><span className="d-qs-l">Credit Notes</span></div>
                        <div className="d-qs"><span className="d-qs-n">{loading ? '-' : stats?.totalPurchaseOrders || 0}</span><span className="d-qs-l">POs</span></div>
                        <div className="d-qs"><span className="d-qs-n">{loading ? '-' : stats?.totalVendorCredits || 0}</span><span className="d-qs-l">Vendor Cr.</span></div>
                        <div className="d-qs"><span className="d-qs-n">{loading ? '-' : stats?.totalEmployees || 0}</span><span className="d-qs-l">Employees</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
