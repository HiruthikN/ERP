import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    FiGrid, FiPackage, FiShoppingCart, FiUsers, FiBarChart2,
    FiChevronDown, FiLogOut, FiMenu, FiX, FiSun, FiMoon,
    FiTag, FiTruck, FiCalendar, FiUser, FiSettings
} from 'react-icons/fi';

const Layout = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [inventoryOpen, setInventoryOpen] = useState(false);
    const [hrOpen, setHrOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => { logout(); navigate('/login'); };

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    // When sidebar is collapsed and user clicks a dropdown group, auto-expand
    const handleGroupClick = (group) => {
        if (collapsed) {
            setCollapsed(false);
            if (group === 'inventory') setInventoryOpen(true);
            if (group === 'hr') setHrOpen(true);
        } else {
            if (group === 'inventory') setInventoryOpen(!inventoryOpen);
            if (group === 'hr') setHrOpen(!hrOpen);
        }
    };

    return (
        <div className="app-layout">
            {/* Mobile Backdrop */}
            {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

            {/* SIDEBAR */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    {!collapsed && <div className="logo"><h2>ERP<span>System</span></h2></div>}
                    {/* Desktop collapse toggle */}
                    <button className="sidebar-toggle desktop-only" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <FiMenu /> : <FiX />}
                    </button>
                    {/* Mobile close */}
                    <button className="sidebar-toggle mobile-only" onClick={() => setMobileOpen(false)}>
                        <FiX />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
                        <span className="nav-icon"><FiGrid /></span>
                        {!collapsed && 'Dashboard'}
                    </NavLink>

                    <button className="nav-item nav-group-toggle" onClick={() => handleGroupClick('inventory')} title="Inventory">
                        <span className="nav-icon"><FiPackage /></span>
                        {!collapsed && <>Inventory <FiChevronDown className={`chevron ${inventoryOpen ? 'rotate' : ''}`} /></>}
                    </button>
                    {inventoryOpen && !collapsed && (
                        <div className="nav-submenu">
                            <NavLink to="/inventory/products" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><FiPackage /> Products</NavLink>
                            <NavLink to="/inventory/categories" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><FiTag /> Categories</NavLink>
                            <NavLink to="/inventory/suppliers" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><FiTruck /> Suppliers</NavLink>
                        </div>
                    )}

                    <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Sales & Invoices">
                        <span className="nav-icon"><FiShoppingCart /></span>
                        {!collapsed && 'Sales & Invoices'}
                    </NavLink>

                    <button className="nav-item nav-group-toggle" onClick={() => handleGroupClick('hr')} title="HR Management">
                        <span className="nav-icon"><FiUsers /></span>
                        {!collapsed && <>HR Management <FiChevronDown className={`chevron ${hrOpen ? 'rotate' : ''}`} /></>}
                    </button>
                    {hrOpen && !collapsed && (
                        <div className="nav-submenu">
                            <NavLink to="/hr/employees" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><FiUsers /> Employees</NavLink>
                            <NavLink to="/hr/attendance" className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}><FiCalendar /> Attendance</NavLink>
                        </div>
                    )}

                    <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Reports">
                        <span className="nav-icon"><FiBarChart2 /></span>
                        {!collapsed && 'Reports'}
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
                                    {/*<NavLink to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}><FiSettings /> Settings</NavLink>*/}  
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
