import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiX, FiEye, FiCheck, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const VendorCredits = () => {
    const [data, setData] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [bills, setBills] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { vendor: '', vendorName: '', bill: '', reason: 'return', notes: '' };
    const [form, setForm] = useState(emptyForm);
    const [items, setItems] = useState([{ product: '', quantity: 1, price: '' }]);

    useEffect(() => { fetchData(); fetchVendors(); fetchBills(); fetchProducts(); }, []);
    const fetchData = async () => { try { const r = await api.get('/vendor-credits'); setData(r.data.data); } catch (e) { } finally { setLoading(false); } };
    const fetchVendors = async () => { try { const r = await api.get('/suppliers'); setVendors(r.data.data); } catch (e) { } };
    const fetchBills = async () => { try { const r = await api.get('/bills'); setBills(r.data.data); } catch (e) { } };
    const fetchProducts = async () => { try { const r = await api.get('/products'); setProducts(r.data.data); } catch (e) { } };

    const validate = () => {
        const e = {};
        if (!form.vendor) e.vendor = 'Vendor is required';
        if (!items.some(i => i.product)) e.items = 'At least one product is required';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { await api.post('/vendor-credits', { ...form, items }); closeModal(); fetchData(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleAction = async (id, action) => { try { await api.put(`/vendor-credits/${id}/${action}`); fetchData(); } catch (e) { } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/vendor-credits/${id}`); fetchData(); } catch (e) { } };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); setItems([{ product: '', quantity: 1, price: '' }]); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    const addItem = () => setItems([...items, { product: '', quantity: 1, price: '' }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, val) => { const n = [...items]; n[i][field] = val; if (field === 'product') { const p = products.find(pr => pr._id === val); if (p) n[i].price = p.cost || p.price; if (errors.items) setErrors(e => ({ ...e, items: '' })); } setItems(n); };

    const filtered = data.filter(d => !statusFilter || d.status === statusFilter);
    const statusBadge = (s) => { const m = { draft: 'badge-info', issued: 'badge-warning', applied: 'badge-success' }; return <span className={`badge ${m[s] || ''}`}>{s?.toUpperCase()}</span>; };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Vendor Credits</h1><p>Track credits from vendors</p></div>
                <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setItems([{ product: '', quantity: 1, price: '' }]); setErrors({}); setShowModal(true); }}><FiPlus /> New Credit</button>
            </div>
            <div className="filters-bar"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All Status</option><option value="draft">Draft</option><option value="issued">Issued</option><option value="applied">Applied</option></select></div>
            <div className="table-container"><table>
                <thead><tr><th>Credit #</th><th>Vendor</th><th>Bill</th><th>Total</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(d => (
                    <tr key={d._id}>
                        <td><strong>{d.creditNumber}</strong></td>
                        <td>{d.vendor?.name || d.vendorName || '—'}</td>
                        <td>{d.bill?.billNumber || '—'}</td>
                        <td>₹{d.total.toLocaleString()}</td>
                        <td>{d.reason}</td>
                        <td>{statusBadge(d.status)}</td>
                        <td><div className="action-buttons">
                            <button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button>
                            {d.status === 'draft' && <button className="btn-icon" onClick={() => handleAction(d._id, 'issue')} title="Issue" style={{ color: 'var(--warning)' }}><FiCheck /></button>}
                            {d.status === 'issued' && <button className="btn-icon" onClick={() => handleAction(d._id, 'apply')} title="Apply" style={{ color: 'var(--success)' }}><FiCheckCircle /></button>}
                            {d.status !== 'applied' && <button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>}
                        </div></td>
                    </tr>
                ))}</tbody>
            </table>{filtered.length === 0 && <div className="empty-state">No vendor credits</div>}</div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>New Vendor Credit</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className={`form-group ${errors.vendor ? 'has-error' : ''}`}><label>Vendor *</label>
                            <select value={form.vendor} onChange={e => { const v = vendors.find(v2 => v2._id === e.target.value); setField('vendor', e.target.value); setForm(f => ({ ...f, vendorName: v?.name || '' })); }}>
                                <option value="">Select</option>{vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                            </select>{errors.vendor && <span className="form-error-text"><FiAlertCircle size={12} />{errors.vendor}</span>}
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Bill</label><select value={form.bill} onChange={e => setForm({ ...form, bill: e.target.value })}><option value="">Select</option>{bills.map(b => <option key={b._id} value={b._id}>{b.billNumber}</option>)}</select></div>
                            <div className="form-group"><label>Reason</label><select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}><option value="return">Return</option><option value="damaged">Damaged</option><option value="overcharge">Overcharge</option><option value="other">Other</option></select></div>
                        </div>
                        <div className={errors.items ? 'has-error' : ''}><label style={{ fontSize: '0.78rem', fontWeight: 600, color: errors.items ? 'var(--danger)' : 'var(--text-light)' }}>Items *</label>{errors.items && <span className="form-error-text" style={{ marginBottom: '4px' }}><FiAlertCircle size={12} />{errors.items}</span>}</div>
                        {items.map((item, i) => (
                            <div key={i} className="form-row" style={{ alignItems: 'flex-end' }}>
                                <div className="form-group"><select value={item.product} onChange={e => updateItem(i, 'product', e.target.value)}><option value="">Product</option>{products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
                                <div className="form-group"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} style={{ width: '70px' }} /></div>
                                <div className="form-group"><input type="number" value={item.price} onChange={e => updateItem(i, 'price', Number(e.target.value))} placeholder="Price" /></div>
                                {items.length > 1 && <button type="button" className="btn-icon btn-delete" onClick={() => removeItem(i)}><FiTrash2 /></button>}
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary" onClick={addItem} style={{ marginBottom: '0.75rem' }}><FiPlus /> Add Item</button>
                        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
                    </form>
                </div></div>
            )}

            {viewing && (
                <div className="modal-overlay" onClick={() => setViewing(null)}><div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>Credit {viewing.creditNumber}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                    <div className="modal-form">
                        <p><strong>Vendor:</strong> {viewing.vendor?.name}</p>
                        <p><strong>Status:</strong> {statusBadge(viewing.status)}</p>
                        <p><strong>Total:</strong> ₹{viewing.total.toLocaleString()}</p>
                        <p><strong>Reason:</strong> {viewing.reason}</p>
                        <table style={{ marginTop: '0.75rem' }}><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                            <tbody>{viewing.items.map((it, i) => <tr key={i}><td>{it.productName}</td><td>{it.quantity}</td><td>₹{it.price.toLocaleString()}</td><td>₹{it.total.toLocaleString()}</td></tr>)}</tbody></table>
                    </div>
                </div></div>
            )}
        </div>
    );
};
export default VendorCredits;
