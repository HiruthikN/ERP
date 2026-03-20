import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiX, FiEye, FiAlertCircle } from 'react-icons/fi';

const PaymentsReceived = () => {
    const [data, setData] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { invoice: '', customer: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'cash', referenceNumber: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); fetchInvoices(); fetchCustomers(); }, []);
    const fetchData = async () => { try { const r = await api.get('/payments-received'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const fetchInvoices = async () => { try { const r = await api.get('/sales'); setInvoices(r.data.data); } catch (e) { console.error(e); } };
    const fetchCustomers = async () => { try { const r = await api.get('/customers'); setCustomers(r.data.data); } catch (e) { console.error(e); } };

    const validate = () => {
        const e = {};
        if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { await api.post('/payments-received', form); closeModal(); fetchData(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/payments-received/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Payments Received</h1><p>Track all incoming payments</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}><FiPlus /> Record Payment</button></div>
            <div className="table-container"><table>
                <thead><tr><th>Payment #</th><th>Invoice</th><th>Customer</th><th>Amount</th><th>Date</th><th>Method</th><th>Actions</th></tr></thead>
                <tbody>{data.map(d => (
                    <tr key={d._id}><td><strong>{d.paymentNumber}</strong></td><td>{d.invoice?.invoiceNumber || '—'}</td><td>{d.customer?.name || '—'}</td><td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{d.amount.toLocaleString()}</td><td>{new Date(d.date).toLocaleDateString()}</td><td><span className="badge badge-info">{d.method?.toUpperCase()}</span></td>
                        <td><div className="action-buttons"><button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button><button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button></div></td></tr>
                ))}</tbody>
            </table>{data.length === 0 && <div className="empty-state">No payments recorded</div>}</div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>Record Payment</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className="form-group"><label>Invoice</label><select value={form.invoice} onChange={e => setForm({ ...form, invoice: e.target.value })}><option value="">Select invoice</option>{invoices.map(i => <option key={i._id} value={i._id}>{i.invoiceNumber} — ₹{i.total}</option>)}</select></div>
                        <div className="form-group"><label>Customer</label><select value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}><option value="">Select customer</option>{customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                        <div className="form-row">
                            <div className={`form-group ${errors.amount ? 'has-error' : ''}`}><label>Amount *</label><input type="number" value={form.amount} onChange={e => setField('amount', e.target.value)} />{errors.amount && <span className="form-error-text"><FiAlertCircle size={12} />{errors.amount}</span>}</div>
                            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Method</label><select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="other">Other</option></select></div>
                            <div className="form-group"><label>Reference #</label><input value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">Record</button></div>
                    </form>
                </div></div>
            )}

            {viewing && (
                <div className="modal-overlay" onClick={() => setViewing(null)}><div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>Payment {viewing.paymentNumber}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                    <div className="modal-form"><p><strong>Invoice:</strong> {viewing.invoice?.invoiceNumber || '—'}</p><p><strong>Customer:</strong> {viewing.customer?.name || '—'}</p><p><strong>Amount:</strong> ₹{viewing.amount.toLocaleString()}</p><p><strong>Method:</strong> {viewing.method}</p><p><strong>Date:</strong> {new Date(viewing.date).toLocaleDateString()}</p>{viewing.referenceNumber && <p><strong>Ref:</strong> {viewing.referenceNumber}</p>}</div>
                </div></div>
            )}
        </div>
    );
};
export default PaymentsReceived;
