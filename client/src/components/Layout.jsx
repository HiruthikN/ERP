import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    FiGrid, FiPackage, FiShoppingCart, FiUsers, FiBarChart2,
    FiChevronDown, FiLogOut, FiMenu, FiX, FiSun, FiMoon,
    FiTag, FiTruck, FiCalendar, FiUser, FiDollarSign,
    FiFileText, FiCreditCard, FiPercent, FiRepeat, FiClipboard,
    FiShoppingBag, FiPlusCircle, FiChevronRight
} from 'react-icons/fi';

const Layout = () => {
    const { user, logout } = useAuth();
    const role = user?.role || '';
    const canSales = role === 'admin' || role === 'sales';
    const canHr = role === 'admin' || role === 'hr';
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [inventoryOpen, setInventoryOpen] = useState(false);
    const [salesOpen, setSalesOpen] = useState(false);
    const [purchaseOpen, setPurchaseOpen] = useState(false);
    const [hrOpen, setHrOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => { logout(); navigate('/login'); };

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    // Auto-open the section that contains the current route
    useEffect(() => {
        const p = location.pathname;
        if (p.startsWith('/inventory')) setInventoryOpen(true);
        if (p.startsWith('/sales')) setSalesOpen(true);
        if (p.startsWith('/purchases')) setPurchaseOpen(true);
        if (p.startsWith('/hr')) setHrOpen(true);
    }, []);

    const handleGroupClick = (group) => {
        if (collapsed) {
            setCollapsed(false);
            if (group === 'inventory') setInventoryOpen(true);
            if (group === 'sales') setSalesOpen(true);
            if (group === 'purchase') setPurchaseOpen(true);
            if (group === 'hr') setHrOpen(true);
        } else {
            if (group === 'inventory') setInventoryOpen(!inventoryOpen);
            if (group === 'sales') setSalesOpen(!salesOpen);
            if (group === 'purchase') setPurchaseOpen(!purchaseOpen);
            if (group === 'hr') setHrOpen(!hrOpen);
        }
    };

    const isGroupActive = (prefix) => location.pathname.startsWith(prefix);

    return (
        <div className="app-layout">
            {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

            {/* SIDEBAR */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    {!collapsed && (
                        <div className="logo">
                            <div className="logo-icon">E</div>
                            <div className="logo-text"><h2>ERP<span>System</span></h2><p className="logo-subtitle">Enterprise Resource</p></div>
                        </div>
                    )}
                    <button className="sidebar-toggle desktop-only" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <FiMenu /> : <FiX />}
                    </button>
                    <button className="sidebar-toggle mobile-only" onClick={() => setMobileOpen(false)}>
                        <FiX />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {/* ─── MAIN ─── */}
                    {!collapsed && <div className="nav-section-label">MAIN</div>}
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
                        <span className="nav-icon"><FiGrid /></span>
                        {!collapsed && <span className="nav-label">Dashboard</span>}
                    </NavLink>

                    {/* ─── INVENTORY + SALES + PURCHASES (admin, sales only) ─── */}
                    {canSales && (<>
                        {!collapsed && <div className="nav-section-label">INVENTORY</div>}
                        <button className={`nav-item nav-group-toggle ${isGroupActive('/inventory') ? 'group-active' : ''}`} onClick={() => handleGroupClick('inventory')} title="Inventory">
                            <span className="nav-icon"><FiPackage /></span>
                            {!collapsed && <><span className="nav-label">Inventory</span><FiChevronRight className={`chevron ${inventoryOpen ? 'rotate' : ''}`} /></>}
                        </button>
                        <div className={`nav-submenu ${inventoryOpen && !collapsed ? 'open' : ''}`}>
                            <NavLink to="/inventory/products" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Products</NavLink>
                            <NavLink to="/inventory/categories" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Categories</NavLink>
                        </div>

                        {!collapsed && <div className="nav-section-label">BUSINESS</div>}
                        <button className={`nav-item nav-group-toggle ${isGroupActive('/sales') ? 'group-active' : ''}`} onClick={() => handleGroupClick('sales')} title="Sales">
                            <span className="nav-icon icon-sales"><FiDollarSign /></span>
                            {!collapsed && <><span className="nav-label">Sales</span><span className="nav-badge nav-badge-green">{9}</span><FiChevronRight className={`chevron ${salesOpen ? 'rotate' : ''}`} /></>}
                        </button>
                        <div className={`nav-submenu submenu-sales ${salesOpen && !collapsed ? 'open' : ''}`}>
                            <NavLink to="/sales/customers" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Customers</NavLink>
                            <NavLink to="/sales/estimates" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Estimates</NavLink>
                            <NavLink to="/sales/retainer-invoices" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Retainer Invoices</NavLink>
                            <NavLink to="/sales/orders" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Sales Orders</NavLink>
                            <NavLink to="/sales/delivery-challans" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Delivery Challans</NavLink>
                            <NavLink to="/sales/invoices" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Invoices</NavLink>
                            <NavLink to="/sales/payments-received" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Payments Received</NavLink>
                            <NavLink to="/sales/recurring-invoices" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Recurring Invoices</NavLink>
                            <NavLink to="/sales/credit-notes" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Credit Notes</NavLink>
                        </div>

                        <button className={`nav-item nav-group-toggle ${isGroupActive('/purchases') ? 'group-active' : ''}`} onClick={() => handleGroupClick('purchase')} title="Purchases">
                            <span className="nav-icon icon-purchase"><FiShoppingBag /></span>
                            {!collapsed && <><span className="nav-label">Purchases</span><span className="nav-badge nav-badge-orange">{8}</span><FiChevronRight className={`chevron ${purchaseOpen ? 'rotate' : ''}`} /></>}
                        </button>
                        <div className={`nav-submenu submenu-purchase ${purchaseOpen && !collapsed ? 'open' : ''}`}>
                            <NavLink to="/purchases/vendors" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Vendors</NavLink>
                            <NavLink to="/purchases/expenses" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Expenses</NavLink>
                            <NavLink to="/purchases/recurring-expenses" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Recurring Expenses</NavLink>
                            <NavLink to="/purchases/purchase-orders" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Purchase Orders</NavLink>
                            <NavLink to="/purchases/bills" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Bills</NavLink>
                            <NavLink to="/purchases/payments-made" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Payments Made</NavLink>
                            <NavLink to="/purchases/recurring-bills" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Recurring Bills</NavLink>
                            <NavLink to="/purchases/vendor-credits" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Vendor Credits</NavLink>
                        </div>
                    </>)}

                    {/* ─── HR (admin, hr only) ─── */}
                    {canHr && (<>
                        {!collapsed && <div className="nav-section-label">PEOPLE</div>}
                        <button className={`nav-item nav-group-toggle ${isGroupActive('/hr') ? 'group-active' : ''}`} onClick={() => handleGroupClick('hr')} title="HR Management">
                            <span className="nav-icon icon-hr"><FiUsers /></span>
                            {!collapsed && <><span className="nav-label">HR Management</span><FiChevronRight className={`chevron ${hrOpen ? 'rotate' : ''}`} /></>}
                        </button>
                        <div className={`nav-submenu submenu-hr ${hrOpen && !collapsed ? 'open' : ''}`}>
                            <NavLink to="/hr/employees" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Employees</NavLink>
                            <NavLink to="/hr/attendance" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Attendance</NavLink>
                            <NavLink to="/hr/payroll" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><span className="sub-dot"></span> Payroll</NavLink>
                        </div>
                    </>)}

                    {/* ─── ANALYTICS ─── */}
                    {!collapsed && <div className="nav-section-label">ANALYTICS</div>}
                    <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Reports">
                        <span className="nav-icon"><FiBarChart2 /></span>
                        {!collapsed && <span className="nav-label">Reports</span>}
                    </NavLink>
                </nav>

                {!collapsed && (
                    <div className="sidebar-footer">
                        <div className="sidebar-footer-text"><span>© 2026 ERPSystem</span></div>
                    </div>
                )}
            </aside>

            {/* TOP NAVBAR */}
            <div className="main-wrapper">
                <header className="top-navbar">
                    <div className="navbar-left">
                        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
                            <FiMenu />
                        </button>
                        <div className="navbar-brand"><h1>ERP<span> System</span></h1></div>
                    </div>
                    <div className="navbar-right">
                        <button className="navbar-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
                            {theme === 'dark' ? <FiSun /> : <FiMoon />}
                        </button>

                        <div className="profile-dropdown" ref={dropdownRef}>
                            <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                                <div className="navbar-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                                <div className="navbar-user-info">
                                    <span className="navbar-user-name">{user?.name}</span>
                                    <span className="navbar-user-role">{user?.role?.toUpperCase()}</span>
                                </div>
                                <FiChevronDown className={`dropdown-chevron ${profileOpen ? 'rotate' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <div className="dropdown-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                                        <div>
                                            <div className="dropdown-name">{user?.name}</div>
                                            <div className="dropdown-email">{user?.email}</div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <NavLink to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}><FiUser /> My Profile</NavLink>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}><FiLogOut /> Log Out</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
