import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiUser, FiMail, FiPhone, FiLock, FiShield, FiSave, FiCheck, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [pwMessage, setPwMessage] = useState('');
    const [error, setError] = useState('');
    const [pwError, setPwError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        const ve = {};
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) ve.email = 'Invalid email format';
        if (form.phone && !/^\d{10}$/.test(form.phone)) ve.phone = 'Phone must be 10 digits';
        setFieldErrors(ve);
        if (Object.keys(ve).length > 0) return;
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', form);
            setUser(res.data.user);
            localStorage.setItem('erp_user', JSON.stringify(res.data.user));
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 4000);
        } catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
        finally { setLoading(false); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError(''); setPwMessage('');
        if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match'); return; }
        if (pwForm.newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
        setPwLoading(true);
        try {
            await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            setPwMessage('Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPwMessage(''), 4000);
        } catch (err) { setPwError(err.response?.data?.message || 'Failed to change password'); }
        finally { setPwLoading(false); }
    };

    return (
        <div className="page-container">
            <div className="page-header"><h1>Account Settings</h1></div>

            <div className="profile-layout">
                {/* Profile Hero */}
                <div className="profile-hero glass-card">
                    <div className="profile-avatar-lg">{user?.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="profile-hero-info">
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                        <span className="profile-role-badge"><FiShield /> {user?.role?.toUpperCase()}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <FiUser /> Personal Info
                    </button>
                    <button className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <FiLock /> Security
                    </button>
                </div>

                {/* Edit Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="profile-section glass-card">
                        <h3>Personal Information</h3>
                        <p className="section-desc">Update your personal details here</p>
                        {message && <div className="alert alert-success"><FiCheck /> {message}</div>}
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleProfileUpdate}>
                            <div className="profile-form-grid">
                                <div className="form-group">
                                    <label><FiUser /> Full Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your full name" />
                                </div>
                                <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
                                    <label><FiMail /> Email Address</label>
                                    <input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' }); }} required placeholder="your@email.com" />
                                    {fieldErrors.email && <span className="form-error-text"><FiAlertCircle size={12} />{fieldErrors.email}</span>}
                                </div>
                                <div className={`form-group ${fieldErrors.phone ? 'has-error' : ''}`}>
                                    <label><FiPhone /> Phone Number</label>
                                    <input type="text" value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' }); }} placeholder="10-digit number" />
                                    {fieldErrors.phone && <span className="form-error-text"><FiAlertCircle size={12} />{fieldErrors.phone}</span>}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1.25rem' }}>
                                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="profile-section glass-card">
                        <h3>Change Password</h3>
                        <p className="section-desc">Ensure your account stays secure with a strong password</p>
                        {pwMessage && <div className="alert alert-success"><FiCheck /> {pwMessage}</div>}
                        {pwError && <div className="alert alert-error">{pwError}</div>}
                        <form onSubmit={handlePasswordChange}>
                            <div className="profile-form-grid">
                                <div className="form-group password-field">
                                    <label>Current Password</label>
                                    <div className="password-input-wrap">
                                        <input type={showPw.current ? 'text' : 'password'} value={pwForm.currentPassword}
                                            onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required placeholder="Enter current password" />
                                        <button type="button" className="pw-toggle" onClick={() => setShowPw({ ...showPw, current: !showPw.current })}>
                                            {showPw.current ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group password-field">
                                    <label>New Password</label>
                                    <div className="password-input-wrap">
                                        <input type={showPw.new ? 'text' : 'password'} value={pwForm.newPassword}
                                            onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required placeholder="Min 6 characters" />
                                        <button type="button" className="pw-toggle" onClick={() => setShowPw({ ...showPw, new: !showPw.new })}>
                                            {showPw.new ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group password-field">
                                    <label>Confirm New Password</label>
                                    <div className="password-input-wrap">
                                        <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirmPassword}
                                            onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required placeholder="Re-enter new password" />
                                        <button type="button" className="pw-toggle" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}>
                                            {showPw.confirm ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ marginTop: '1.25rem' }}>
                                <FiLock /> {pwLoading ? 'Changing...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
