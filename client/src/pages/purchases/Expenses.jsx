import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiEye, FiCheck, FiDollarSign, FiAlertCircle } from 'react-icons/fi';

const Expenses = () => {
    const [data, setData] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { category: '', amount: '', date: new Date().toISOString().slice(0, 10), vendor: '', vendorName: '', description: '', paymentMethod: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); fetchVendors(); }, []);
    const fetchData = async () => { try { const r = await api.get('/expenses'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const fetchVendors = async () => { try { const r = await api.get('/suppliers'); setVendors(r.data.data); } catch (e) { console.error(e); } };

    const validate = () => {
        const e = {};
        if (!form.category.trim()) e.category = 'Category is required';
        if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { if (editing) { await api.put(`/expenses/${editing._id}`, form); } else { await api.post('/expenses', form); } closeModal(); fetchData(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleAction = async (id, action) => { try { await api.put(`/expenses/${id}/${action}`); fetchData(); } catch (e) { console.error(e); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/expenses/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const openEdit = (d) => { setEditing(d); setForm({ category: d.category, amount: d.amount, date: d.date ? d.date.slice(0, 10) : '', vendor: d.vendor?._id || '', vendorName: d.vendorName, description: d.description, paymentMethod: d.paymentMethod, notes: d.notes }); setErrors({}); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    const filtered = data.filter(d => !statusFilter || d.status === statusFilter);
    const statusBadge = (s) => { const m = { pending: 'badge-warning', approved: 'badge-info', paid: 'badge-success' }; return <span className={`badge ${m[s] || ''}`}>{s?.toUpperCase()}</span>; };
    const totalExpenses = filtered.reduce((s, d) => s + d.amount, 0);

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Expenses</h1><p>Track business expenses • Total: ₹{totalExpenses.toLocaleString()}</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setEditing(null); setShowModal(true); }}><FiPlus /> Add Expense</button></div>
            <div className="filters-bar"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option></select></div>
            <div className="table-container"><table>
                <thead><tr><th>Expense #</th><th>Category</th><th>Amount</th><th>Date</th><th>Vendor</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(d => (<tr key={d._id}><td><strong>{d.expenseNumber}</strong></td><td>{d.category}</td><td style={{ color: 'var(--danger)', fontWeight: 700 }}>₹{d.amount.toLocaleString()}</td><td>{new Date(d.date).toLocaleDateString()}</td><td>{d.vendor?.name || d.vendorName || '—'}</td><td>{statusBadge(d.status)}</td>
                    <td><div className="action-buttons"><button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button>{d.status === 'pending' && <><button className="btn-icon" onClick={() => handleAction(d._id, 'approve')} title="Approve" style={{ color: 'var(--info)' }}><FiCheck /></button><button className="btn-icon btn-edit" onClick={() => openEdit(d)}><FiEdit2 /></button></>}{d.status === 'approved' && <button className="btn-icon" onClick={() => handleAction(d._id, 'mark-paid')} title="Mark Paid" style={{ color: 'var(--success)' }}><FiDollarSign /></button>}{d.status !== 'paid' && <button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>}</div></td></tr>))}</tbody>
            </table>{filtered.length === 0 && <div className="empty-state">No expenses</div>}</div>
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>{editing ? 'Edit Expense' : 'New Expense'}</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className="form-row">
                            <div className={`form-group ${errors.category ? 'has-error' : ''}`}><label>Category *</label><input value={form.category} onChange={e => setField('category', e.target.value)} placeholder="e.g. Office Supplies" />{errors.category && <span className="form-error-text"><FiAlertCircle size={12} />{errors.category}</span>}</div>
                            <div className={`form-group ${errors.amount ? 'has-error' : ''}`}><label>Amount *</label><input type="number" value={form.amount} onChange={e => setField('amount', e.target.value)} />{errors.amount && <span className="form-error-text"><FiAlertCircle size={12} />{errors.amount}</span>}</div>
                        </div>
                        <div className="form-row"><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div><div className="form-group"><label>Vendor</label><select value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}><option value="">Select</option>{vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}</select></div></div>
                        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
                    </form>
                </div></div>
            )}
            {viewing && (
                <div className="modal-overlay" onClick={() => setViewing(null)}><div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>Expense {viewing.expenseNumber}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                    <div className="modal-form"><p><strong>Category:</strong> {viewing.category}</p><p><strong>Amount:</strong> ₹{viewing.amount.toLocaleString()}</p><p><strong>Date:</strong> {new Date(viewing.date).toLocaleDateString()}</p><p><strong>Vendor:</strong> {viewing.vendor?.name || viewing.vendorName || '—'}</p><p><strong>Status:</strong> {statusBadge(viewing.status)}</p>{viewing.description && <p><strong>Description:</strong> {viewing.description}</p>}</div>
                </div></div>
            )}
        </div>
    );
};
export default Expenses;
