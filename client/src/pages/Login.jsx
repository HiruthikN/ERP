import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            <div className="auth-container">
                <div className="auth-left">
                    <div className="auth-brand">
                        <h1>ERP<span>System</span></h1>
                        <p>Complete Business Management Solution</p>
                    </div>
                    <div className="auth-features">
                        <div className="feature-item"><span className="feature-dot"></span> Inventory Management</div>
                        <div className="feature-item"><span className="feature-dot"></span> Sales & Invoicing</div>
                        <div className="feature-item"><span className="feature-dot"></span> HR Management</div>
                        <div className="feature-item"><span className="feature-dot"></span> Reporting & Analytics</div>
                    </div>
                </div>
                <div className="auth-right">
                    <div className="auth-form-container">
                        <h2>Welcome Back</h2>
                        <p className="auth-subtitle">Sign in to your account</p>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label><FiMail /> Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><FiLock /> Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                <FiLogIn /> {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <p className="auth-link">
                            Don't have an account? <Link to="/register">Register</Link>
                        </p>

                        <div className="demo-credentials">
                            <p><strong>Credentials:</strong></p>
                            <code>vp@admin.com / Admin@12</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
