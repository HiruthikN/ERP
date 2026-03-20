import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiAlertCircle } from 'react-icons/fi';

const Vendors = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { name: '', email: '', phone: '', company: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); }, []);
    const fetchData = async () => { try { const r = await api.get('/suppliers'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Vendor name is required';
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
        if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { if (editing) { await api.put(`/suppliers/${editing._id}`, form); } else { await api.post('/suppliers', form); } closeModal(); fetchData(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/suppliers/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const openEdit = (d) => { setEditing(d); setForm({ name: d.name, email: d.email || '', phone: d.phone || '', company: d.company || '' }); setErrors({}); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };
    const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Vendors</h1><p>Manage vendors / suppliers</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setEditing(null); setShowModal(true); }}><FiPlus /> Add Vendor</button></div>
            <div className="filters-bar"><div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}><FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem', width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.82rem' }} /></div></div>
            <div className="table-container"><table>
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(d => (<tr key={d._id}><td><strong>{d.name}</strong></td><td>{d.email || '—'}</td><td>{d.phone || '—'}</td><td>{d.company || '—'}</td><td><div className="action-buttons"><button className="btn-icon btn-edit" onClick={() => openEdit(d)}><FiEdit2 /></button><button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button></div></td></tr>))}</tbody>
            </table>{filtered.length === 0 && <div className="empty-state">No vendors</div>}</div>
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>{editing ? 'Edit Vendor' : 'New Vendor'}</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className={`form-group ${errors.name ? 'has-error' : ''}`}><label>Name *</label><input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Vendor name" />{errors.name && <span className="form-error-text"><FiAlertCircle size={12} />{errors.name}</span>}</div>
                        <div className="form-row">
                            <div className={`form-group ${errors.email ? 'has-error' : ''}`}><label>Email</label><input type="email" value={form.email} onChange={e => setField('email', e.target.value)} />{errors.email && <span className="form-error-text"><FiAlertCircle size={12} />{errors.email}</span>}</div>
                            <div className={`form-group ${errors.phone ? 'has-error' : ''}`}><label>Phone</label><input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="10-digit number" />{errors.phone && <span className="form-error-text"><FiAlertCircle size={12} />{errors.phone}</span>}</div>
                        </div>
                        <div className="form-group"><label>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
                    </form>
                </div></div>
            )}
        </div>
    );
};
export default Vendors;
