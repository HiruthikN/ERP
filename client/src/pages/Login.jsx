import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
                        <div className="auth-logo-icon">⚡</div>
                        <h1>ERP<span>System</span></h1>
                        <p>Complete Business Management Solution</p>
                    </div>
                    <div className="auth-features">
                        <div className="feature-item"><span className="feature-dot"></span> Inventory Management</div>
                        <div className="feature-item"><span className="feature-dot"></span> Sales & Invoicing</div>
                        <div className="feature-item"><span className="feature-dot"></span> HR Management</div>
                        <div className="feature-item"><span className="feature-dot"></span> Reporting & Analytics</div>
                    </div>
                    {/* Animated shapes */}
                    <div className="auth-left-shapes">
                        <div className="shape shape-1"></div>
                        <div className="shape shape-2"></div>
                        <div className="shape shape-3"></div>
                    </div>
                </div>
                <div className="auth-right">
                    <div className="auth-form-container">
                        <h2>Welcome Back 👋</h2>
                        <p className="auth-subtitle">Sign in to your account to continue</p>

                        {error && <div className="alert alert-error auth-shake">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group auth-input-group">
                                <label><FiMail /> Email Address</label>
                                <div className="auth-input-wrap">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            <div className="form-group auth-input-group">
                                <label><FiLock /> Password</label>
                                <div className="auth-input-wrap">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                                        {showPw ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block auth-submit-btn" disabled={loading}>
                                {loading ? (
                                    <span className="auth-loader-wrap">
                                        <span className="auth-spinner"></span> Signing in...
                                    </span>
                                ) : (
                                    <><FiLogIn /> Sign In</>
                                )}
                            </button>
                        </form>

                        <p className="auth-link">
                            Don't have an account? <Link to="/register">Register</Link>
                        </p>

                        <div className="demo-credentials">
                            <p><strong>Demo Credentials:</strong></p>
                            <code>vp@admin.com / Admin@12</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
