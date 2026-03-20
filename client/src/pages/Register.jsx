import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password, form.role);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Animated background orbs */}
            <div className="auth-orb auth-orb-1"></div>
            <div className="auth-orb auth-orb-2"></div>
            <div className="auth-orb auth-orb-3"></div>

            <div className="auth-container">
                <div className="auth-left">
                    <div className="auth-brand">
                        <div className="auth-logo-icon">🚀</div>
                        <h1>ERP<span>System</span></h1>
                        <p>Complete Business Management Solution</p>
                    </div>
                    <div className="auth-features">
                        <div className="feature-item"><span className="feature-dot"></span> Inventory Management</div>
                        <div className="feature-item"><span className="feature-dot"></span> Sales & Invoicing</div>
                        <div className="feature-item"><span className="feature-dot"></span> HR Management</div>
                        <div className="feature-item"><span className="feature-dot"></span> Reporting & Analytics</div>
                    </div>
                    <div className="auth-left-shapes">
                        <div className="shape shape-1"></div>
                        <div className="shape shape-2"></div>
                        <div className="shape shape-3"></div>
                    </div>
                </div>
                <div className="auth-right">
                    <div className="auth-form-container">
                        <h2>Create Account 🎉</h2>
                        <p className="auth-subtitle">Register to get started with your business</p>

                        {error && <div className="alert alert-error auth-shake">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group auth-input-group">
                                <label><FiUser /> Full Name</label>
                                <div className="auth-input-wrap">
                                    <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
                                </div>
                            </div>
                            <div className="form-group auth-input-group">
                                <label><FiMail /> Email Address</label>
                                <div className="auth-input-wrap">
                                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                                </div>
                            </div>
                            <div className="form-group auth-input-group">
                                <label><FiLock /> Password</label>
                                <div className="auth-input-wrap">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Min 6 characters"
                                        required
                                        minLength={6}
                                    />
                                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                                        {showPw ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group auth-input-group">
                                <label><FiUser /> Role</label>
                                <select name="role" value={form.role} onChange={handleChange}>
                                    <option value="sales">Sales</option>
                                    <option value="hr">HR</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block auth-submit-btn" disabled={loading}>
                                {loading ? (
                                    <span className="auth-loader-wrap">
                                        <span className="auth-spinner"></span> Creating Account...
                                    </span>
                                ) : (
                                    <><FiUserPlus /> Create Account</>
                                )}
                            </button>
                        </form>

                        <p className="auth-link">
                            Already have an account? <Link to="/login">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
