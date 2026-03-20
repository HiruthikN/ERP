import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiX, FiEye, FiAlertCircle } from 'react-icons/fi';

const PaymentsMade = () => {
    const [data, setData] = useState([]);
    const [bills, setBills] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { bill: '', vendor: '', amount: '', date: new Date().toISOString().slice(0, 10), method: 'cash', referenceNumber: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchData(); fetchBills(); fetchVendors(); }, []);
    const fetchData = async () => { try { const r = await api.get('/payments-made'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const fetchBills = async () => { try { const r = await api.get('/bills'); setBills(r.data.data); } catch (e) { } };
    const fetchVendors = async () => { try { const r = await api.get('/suppliers'); setVendors(r.data.data); } catch (e) { } };

    const validate = () => {
        const e = {};
        if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { await api.post('/payments-made', form); closeModal(); fetchData(); fetchBills(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/payments-made/${id}`); fetchData(); } catch (e) { } };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Payments Made</h1><p>Track vendor payments</p></div>
                <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}><FiPlus /> Record Payment</button>
            </div>
            <div className="table-container"><table>
                <thead><tr><th>Payment #</th><th>Bill</th><th>Vendor</th><th>Amount</th><th>Date</th><th>Method</th><th>Actions</th></tr></thead>
                <tbody>{data.map(d => (
                    <tr key={d._id}>
                        <td><strong>{d.paymentNumber}</strong></td>
                        <td>{d.bill?.billNumber || '—'}</td>
                        <td>{d.vendor?.name || '—'}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>₹{d.amount.toLocaleString()}</td>
                        <td>{new Date(d.date).toLocaleDateString()}</td>
                        <td><span className="badge badge-info">{d.method?.toUpperCase()}</span></td>
                        <td><div className="action-buttons">
                            <button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button>
                            <button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>
                        </div></td>
                    </tr>
                ))}</tbody>
            </table>{data.length === 0 && <div className="empty-state">No payments</div>}</div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Record Payment</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                        <form onSubmit={handleSubmit} className="modal-form" noValidate>
                            <div className="form-group"><label>Bill</label>
                                <select value={form.bill} onChange={e => setForm({ ...form, bill: e.target.value })}>
                                    <option value="">Select bill</option>
                                    {bills.filter(b => b.status !== 'paid').map(b => <option key={b._id} value={b._id}>{b.billNumber} — ₹{b.total}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label>Vendor</label>
                                <select value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}>
                                    <option value="">Select</option>{vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className={`form-group ${errors.amount ? 'has-error' : ''}`}><label>Amount *</label><input type="number" value={form.amount} onChange={e => setField('amount', e.target.value)} />{errors.amount && <span className="form-error-text"><FiAlertCircle size={12} />{errors.amount}</span>}</div>
                                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Method</label>
                                    <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                                        <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option>
                                        <option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Reference #</label><input value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">Record</button></div>
                        </form>
                    </div>
                </div>
            )}

            {viewing && (
                <div className="modal-overlay" onClick={() => setViewing(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Payment {viewing.paymentNumber}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                        <div className="modal-form">
                            <p><strong>Bill:</strong> {viewing.bill?.billNumber || '—'}</p>
                            <p><strong>Amount:</strong> ₹{viewing.amount.toLocaleString()}</p>
                            <p><strong>Method:</strong> {viewing.method}</p>
                            <p><strong>Date:</strong> {new Date(viewing.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PaymentsMade;
