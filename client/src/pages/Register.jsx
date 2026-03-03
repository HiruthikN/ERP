import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' });
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
                        <h2>Create Account</h2>
                        <p className="auth-subtitle">Register a new account</p>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label><FiUser /> Full Name</label>
                                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter your name" required />
                            </div>
                            <div className="form-group">
                                <label><FiMail /> Email</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" required />
                            </div>
                            <div className="form-group">
                                <label><FiLock /> Password</label>
                                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label><FiUser /> Role</label>
                                <select name="role" value={form.role} onChange={handleChange}>
                                    <option value="sales">Sales</option>
                                    <option value="hr">HR</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                <FiUserPlus /> {loading ? 'Creating...' : 'Create Account'}
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
