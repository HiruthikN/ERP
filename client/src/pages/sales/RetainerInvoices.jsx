import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiEye, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi';

const RetainerInvoices = () => {
    const [data, setData] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { customer: '', amount: '', period: '', startDate: '', endDate: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); fetchCustomers(); }, []);
    const fetchData = async () => { try { const r = await api.get('/retainer-invoices'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const fetchCustomers = async () => { try { const r = await api.get('/customers'); setCustomers(r.data.data); } catch (e) { console.error(e); } };

    const validate = () => {
        const e = {};
        if (!form.customer) e.customer = 'Customer is required';
        if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            if (editing) { await api.put(`/retainer-invoices/${editing._id}`, form); }
            else { await api.post('/retainer-invoices', form); }
            closeModal(); fetchData();
        } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); }
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const handleAction = async (id, action) => { try { await api.put(`/retainer-invoices/${id}/${action}`); fetchData(); } catch (e) { console.error(e); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/retainer-invoices/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const openEdit = (d) => { setEditing(d); setForm({ customer: d.customer?._id || '', amount: d.amount, period: d.period, startDate: d.startDate ? d.startDate.slice(0, 10) : '', endDate: d.endDate ? d.endDate.slice(0, 10) : '', notes: d.notes }); setErrors({}); setShowModal(true); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    const filtered = data.filter(d => !statusFilter || d.status === statusFilter);
    const statusBadge = (s) => { const m = { draft: 'badge-info', sent: 'badge-warning', paid: 'badge-success', cancelled: 'badge-danger' }; return <span className={`badge ${m[s] || ''}`}>{s?.toUpperCase()}</span>; };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Retainer Invoices</h1><p>Manage retainer-based billing</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setEditing(null); setShowModal(true); }}><FiPlus /> New Retainer</button></div>
            <div className="filters-bar"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></div>
            <div className="table-container"><table>
                <thead><tr><th>Number</th><th>Customer</th><th>Amount</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(d => (
                    <tr key={d._id}><td><strong>{d.retainerNumber}</strong></td><td>{d.customer?.name || '—'}</td><td>₹{d.amount.toLocaleString()}</td><td>{d.period || '—'}</td><td>{statusBadge(d.status)}</td>
                        <td><div className="action-buttons">
                            <button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button>
                            {d.status === 'draft' && <><button className="btn-icon" onClick={() => handleAction(d._id, 'send')} title="Send"><FiSend /></button><button className="btn-icon btn-edit" onClick={() => openEdit(d)}><FiEdit2 /></button></>}
                            {d.status === 'sent' && <button className="btn-icon" onClick={() => handleAction(d._id, 'mark-paid')} title="Mark Paid" style={{ color: 'var(--success)' }}><FiCheck /></button>}
                            {d.status !== 'paid' && <button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>}
                        </div></td></tr>
                ))}</tbody>
            </table>{filtered.length === 0 && <div className="empty-state">No retainer invoices</div>}</div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>{editing ? 'Edit Retainer' : 'New Retainer Invoice'}</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className={`form-group ${errors.customer ? 'has-error' : ''}`}><label>Customer *</label><select value={form.customer} onChange={e => setField('customer', e.target.value)}><option value="">Select customer</option>{customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>{errors.customer && <span className="form-error-text"><FiAlertCircle size={12} />{errors.customer}</span>}</div>
                        <div className="form-row">
                            <div className={`form-group ${errors.amount ? 'has-error' : ''}`}><label>Amount *</label><input type="number" value={form.amount} onChange={e => setField('amount', e.target.value)} />{errors.amount && <span className="form-error-text"><FiAlertCircle size={12} />{errors.amount}</span>}</div>
                            <div className="form-group"><label>Period</label><input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. Monthly" /></div>
                        </div>
                        <div className="form-row"><div className="form-group"><label>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div><div className="form-group"><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div></div>
                        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
                    </form>
                </div></div>
            )}

            {viewing && (
                <div className="modal-overlay" onClick={() => setViewing(null)}><div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>Retainer {viewing.retainerNumber}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                    <div className="modal-form"><p><strong>Customer:</strong> {viewing.customer?.name}</p><p><strong>Amount:</strong> ₹{viewing.amount.toLocaleString()}</p><p><strong>Period:</strong> {viewing.period || '—'}</p><p><strong>Status:</strong> {statusBadge(viewing.status)}</p>{viewing.notes && <p><strong>Notes:</strong> {viewing.notes}</p>}</div>
                </div></div>
            )}
        </div>
    );
};
export default RetainerInvoices;
