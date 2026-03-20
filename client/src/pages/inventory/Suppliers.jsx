import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertCircle } from 'react-icons/fi';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', company: '' });
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        try { const res = await api.get('/suppliers'); setSuppliers(res.data.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setForm(item ? { name: item.name, email: item.email, phone: item.phone, address: item.address, company: item.company } : { name: '', email: '', phone: '', address: '', company: '' });
        setError(''); setErrors({});
        setShowModal(true);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Supplier name is required';
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
        if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setError('');
        try {
            if (editItem) await api.put(`/suppliers/${editItem._id}`, form);
            else await api.post('/suppliers', form);
            setShowModal(false);
            fetch();
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this supplier?')) return;
        try { await api.delete(`/suppliers/${id}`); fetch(); }
        catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Suppliers</h1><p>{suppliers.length} suppliers</p></div>
                <button className="btn btn-primary" onClick={() => openModal()}><FiPlus /> Add Supplier</button>
            </div>
            <div className="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s._id}>
                                <td><strong>{s.name}</strong></td>
                                <td>{s.company || '-'}</td>
                                <td>{s.email || '-'}</td>
                                <td>{s.phone || '-'}</td>
                                <td>{s.address || '-'}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => openModal(s)}><FiEdit2 /></button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(s._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {suppliers.length === 0 && <div className="empty-state">No suppliers found</div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit' : 'Add'} Supplier</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form" noValidate>
                            <div className="form-row">
                                <div className={`form-group ${errors.name ? 'has-error' : ''}`}><label>Name *</label><input type="text" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} />{errors.name && <span className="form-error-text"><FiAlertCircle size={12} />{errors.name}</span>}</div>
                                <div className="form-group"><label>Company</label><input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className={`form-group ${errors.email ? 'has-error' : ''}`}><label>Email</label><input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }} />{errors.email && <span className="form-error-text"><FiAlertCircle size={12} />{errors.email}</span>}</div>
                                <div className={`form-group ${errors.phone ? 'has-error' : ''}`}><label>Phone</label><input type="text" value={form.phone} onChange={e => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }} placeholder="10-digit number" />{errors.phone && <span className="form-error-text"><FiAlertCircle size={12} />{errors.phone}</span>}</div>
                            </div>
                            <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows="2" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
