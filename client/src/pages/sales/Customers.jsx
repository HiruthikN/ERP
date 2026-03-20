import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUser, FiSearch, FiAlertCircle } from 'react-icons/fi';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { name: '', email: '', phone: '', company: '', address: '', city: '', state: '', zipCode: '', gstNumber: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); }, []);
    const fetchData = async () => { try { const r = await api.get('/customers'); setCustomers(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Customer name is required';
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
        if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            if (editing) { await api.put(`/customers/${editing._id}`, form); }
            else { await api.post('/customers', form); }
            closeModal(); fetchData();
        } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error saving customer'); }
    };

    const handleDelete = async (id) => { if (!window.confirm('Delete this customer?')) return; try { await api.delete(`/customers/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, address: c.address, city: c.city, state: c.state, zipCode: c.zipCode, gstNumber: c.gstNumber, notes: c.notes }); setErrors({}); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setErrors({}); };

    const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Customers</h1><p>Manage your customer base</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setEditing(null); setShowModal(true); }}><FiPlus /> Add Customer</button></div>
            <div className="filters-bar"><div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}><FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem', width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.82rem' }} /></div></div>
            <div className="table-container"><table>
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(c => (
                    <tr key={c._id}><td><strong>{c.name}</strong></td><td>{c.email || '—'}</td><td>{c.phone || '—'}</td><td>{c.company || '—'}</td><td><code>{c.gstNumber || '—'}</code></td><td><span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{c.status?.toUpperCase()}</span></td>
                        <td><div className="action-buttons"><button className="btn-icon btn-edit" onClick={() => openEdit(c)}><FiEdit2 /></button><button className="btn-icon btn-delete" onClick={() => handleDelete(c._id)}><FiTrash2 /></button></div></td></tr>
                ))}</tbody>
            </table>{filtered.length === 0 && <div className="empty-state">No customers found</div>}</div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editing ? 'Edit Customer' : 'New Customer'}</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                        <form onSubmit={handleSubmit} className="modal-form" noValidate>
                            <div className={`form-group ${errors.name ? 'has-error' : ''}`}><label>Name *</label><input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} placeholder="Customer name" />{errors.name && <span className="form-error-text"><FiAlertCircle size={12} />{errors.name}</span>}</div>
                            <div className="form-row">
                                <div className={`form-group ${errors.email ? 'has-error' : ''}`}><label>Email</label><input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }} />{errors.email && <span className="form-error-text"><FiAlertCircle size={12} />{errors.email}</span>}</div>
                                <div className={`form-group ${errors.phone ? 'has-error' : ''}`}><label>Phone</label><input value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }} placeholder="10-digit number" />{errors.phone && <span className="form-error-text"><FiAlertCircle size={12} />{errors.phone}</span>}</div>
                            </div>
                            <div className="form-group"><label>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                            <div className="form-group"><label>GST Number</label><input value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} /></div>
                            <div className="form-group"><label>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                                <div className="form-group"><label>State</label><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
                                <div className="form-group"><label>Zip</label><input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Customers;
