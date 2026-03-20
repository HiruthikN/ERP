import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiX, FiEye, FiToggleLeft, FiToggleRight, FiAlertCircle } from 'react-icons/fi';

const RecurringExpenses = () => {
    const [data, setData] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { profileName: '', category: '', amount: '', vendor: '', vendorName: '', frequency: 'monthly', nextDate: '', endDate: '', description: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); fetchVendors(); }, []);
    const fetchData = async () => { try { const r = await api.get('/recurring-expenses'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const fetchVendors = async () => { try { const r = await api.get('/suppliers'); setVendors(r.data.data); } catch (e) { console.error(e); } };

    const validate = () => {
        const e = {};
        if (!form.profileName.trim()) e.profileName = 'Profile name is required';
        if (!form.category.trim()) e.category = 'Category is required';
        if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
        if (!form.nextDate) e.nextDate = 'Next date is required';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { await api.post('/recurring-expenses', form); closeModal(); fetchData(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleToggle = async (id) => { try { await api.put(`/recurring-expenses/${id}/toggle`); fetchData(); } catch (e) { console.error(e); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/recurring-expenses/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Recurring Expenses</h1><p>Automated expense tracking</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}><FiPlus /> New Template</button></div>
            <div className="table-container"><table>
                <thead><tr><th>Profile</th><th>Category</th><th>Amount</th><th>Vendor</th><th>Frequency</th><th>Next Date</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>{data.map(d => (<tr key={d._id}><td><strong>{d.profileName}</strong></td><td>{d.category}</td><td>₹{d.amount.toLocaleString()}</td><td>{d.vendor?.name || d.vendorName || '—'}</td><td><span className="badge badge-info">{d.frequency?.toUpperCase()}</span></td><td>{d.nextDate ? new Date(d.nextDate).toLocaleDateString() : '—'}</td><td><button className="btn-icon" onClick={() => handleToggle(d._id)} style={{ color: d.active ? 'var(--success)' : 'var(--text-muted)' }}>{d.active ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}</button></td>
                    <td><div className="action-buttons"><button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button><button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button></div></td></tr>))}</tbody>
            </table>{data.length === 0 && <div className="empty-state">No recurring expenses</div>}</div>
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>New Recurring Expense</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className={`form-group ${errors.profileName ? 'has-error' : ''}`}><label>Profile Name *</label><input value={form.profileName} onChange={e => setField('profileName', e.target.value)} />{errors.profileName && <span className="form-error-text"><FiAlertCircle size={12} />{errors.profileName}</span>}</div>
                        <div className="form-row">
                            <div className={`form-group ${errors.category ? 'has-error' : ''}`}><label>Category *</label><input value={form.category} onChange={e => setField('category', e.target.value)} />{errors.category && <span className="form-error-text"><FiAlertCircle size={12} />{errors.category}</span>}</div>
                            <div className={`form-group ${errors.amount ? 'has-error' : ''}`}><label>Amount *</label><input type="number" value={form.amount} onChange={e => setField('amount', e.target.value)} />{errors.amount && <span className="form-error-text"><FiAlertCircle size={12} />{errors.amount}</span>}</div>
                        </div>
                        <div className="form-row"><div className="form-group"><label>Vendor</label><select value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}><option value="">Select</option>{vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}</select></div><div className="form-group"><label>Frequency</label><select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div></div>
                        <div className="form-row">
                            <div className={`form-group ${errors.nextDate ? 'has-error' : ''}`}><label>Next Date *</label><input type="date" value={form.nextDate} onChange={e => setField('nextDate', e.target.value)} />{errors.nextDate && <span className="form-error-text"><FiAlertCircle size={12} />{errors.nextDate}</span>}</div>
                            <div className="form-group"><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
                    </form>
                </div></div>
            )}
            {viewing && (
                <div className="modal-overlay" onClick={() => setViewing(null)}><div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>{viewing.profileName}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                    <div className="modal-form"><p><strong>Category:</strong> {viewing.category}</p><p><strong>Amount:</strong> ₹{viewing.amount.toLocaleString()}</p><p><strong>Frequency:</strong> {viewing.frequency}</p><p><strong>Active:</strong> {viewing.active ? 'Yes' : 'No'}</p></div>
                </div></div>
            )}
        </div>
    );
};
export default RecurringExpenses;
