import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiX, FiEye, FiToggleLeft, FiToggleRight, FiAlertCircle } from 'react-icons/fi';

const RecurringInvoices = () => {
    const [data, setData] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);
    const emptyForm = { profileName: '', customer: '', frequency: 'monthly', nextDate: '', endDate: '', notes: '', taxRate: 0, discount: 0 };
    const [form, setForm] = useState(emptyForm);
    const [items, setItems] = useState([{ product: '', quantity: 1, price: '' }]);

    useEffect(() => { fetchData(); fetchCustomers(); fetchProducts(); }, []);
    const fetchData = async () => { try { const r = await api.get('/recurring-invoices'); setData(r.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const fetchCustomers = async () => { try { const r = await api.get('/customers'); setCustomers(r.data.data); } catch (e) { console.error(e); } };
    const fetchProducts = async () => { try { const r = await api.get('/products'); setProducts(r.data.data); } catch (e) { console.error(e); } };

    const validate = () => {
        const e = {};
        if (!form.profileName.trim()) e.profileName = 'Profile name is required';
        if (!form.customer) e.customer = 'Customer is required';
        if (!form.nextDate) e.nextDate = 'Next date is required';
        if (!items.some(i => i.product)) e.items = 'At least one product is required';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (!validate()) return; try { await api.post('/recurring-invoices', { ...form, items }); closeModal(); fetchData(); } catch (e) { console.error(e); alert(e.response?.data?.message || 'Error'); } };
    const handleToggle = async (id) => { try { await api.put(`/recurring-invoices/${id}/toggle`); fetchData(); } catch (e) { console.error(e); } };
    const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await api.delete(`/recurring-invoices/${id}`); fetchData(); } catch (e) { console.error(e); } };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); setItems([{ product: '', quantity: 1, price: '' }]); setErrors({}); };
    const setField = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: '' })); };

    const addItem = () => setItems([...items, { product: '', quantity: 1, price: '' }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, val) => { const n = [...items]; n[i][field] = val; if (field === 'product') { const p = products.find(pr => pr._id === val); if (p) n[i].price = p.price; if (errors.items) setErrors(e => ({ ...e, items: '' })); } setItems(n); };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header"><div><h1>Recurring Invoices</h1><p>Auto-generated invoice templates</p></div><button className="btn btn-primary" onClick={() => { setForm(emptyForm); setItems([{ product: '', quantity: 1, price: '' }]); setErrors({}); setShowModal(true); }}><FiPlus /> New Template</button></div>
            <div className="table-container"><table>
                <thead><tr><th>Profile</th><th>Customer</th><th>Total</th><th>Frequency</th><th>Next Date</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>{data.map(d => (
                    <tr key={d._id}><td><strong>{d.profileName}</strong></td><td>{d.customer?.name || '—'}</td><td>₹{d.total.toLocaleString()}</td><td><span className="badge badge-info">{d.frequency?.toUpperCase()}</span></td><td>{d.nextDate ? new Date(d.nextDate).toLocaleDateString() : '—'}</td><td><button className="btn-icon" onClick={() => handleToggle(d._id)} style={{ color: d.active ? 'var(--success)' : 'var(--text-muted)' }}>{d.active ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}</button></td>
                        <td><div className="action-buttons"><button className="btn-icon" onClick={() => setViewing(d)}><FiEye /></button><button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)}><FiTrash2 /></button></div></td></tr>
                ))}</tbody>
            </table>{data.length === 0 && <div className="empty-state">No recurring invoices</div>}</div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}><div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>New Recurring Invoice</h3><button className="btn-icon" onClick={closeModal}><FiX /></button></div>
                    <form onSubmit={handleSubmit} className="modal-form" noValidate>
                        <div className={`form-group ${errors.profileName ? 'has-error' : ''}`}><label>Profile Name *</label><input value={form.profileName} onChange={e => setField('profileName', e.target.value)} />{errors.profileName && <span className="form-error-text"><FiAlertCircle size={12} />{errors.profileName}</span>}</div>
                        <div className={`form-group ${errors.customer ? 'has-error' : ''}`}><label>Customer *</label><select value={form.customer} onChange={e => setField('customer', e.target.value)}><option value="">Select</option>{customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>{errors.customer && <span className="form-error-text"><FiAlertCircle size={12} />{errors.customer}</span>}</div>
                        <div className="form-row"><div className="form-group"><label>Frequency</label><select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div><div className={`form-group ${errors.nextDate ? 'has-error' : ''}`}><label>Next Date *</label><input type="date" value={form.nextDate} onChange={e => setField('nextDate', e.target.value)} />{errors.nextDate && <span className="form-error-text"><FiAlertCircle size={12} />{errors.nextDate}</span>}</div></div>
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
                    <div className="modal-header"><h3>{viewing.profileName}</h3><button className="btn-icon" onClick={() => setViewing(null)}><FiX /></button></div>
                    <div className="modal-form"><p><strong>Customer:</strong> {viewing.customer?.name}</p><p><strong>Frequency:</strong> {viewing.frequency}</p><p><strong>Total:</strong> ₹{viewing.total.toLocaleString()}</p><p><strong>Active:</strong> {viewing.active ? 'Yes' : 'No'}</p><p><strong>Next Date:</strong> {viewing.nextDate ? new Date(viewing.nextDate).toLocaleDateString() : '—'}</p>
                        <table style={{ marginTop: '0.75rem' }}><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{viewing.items.map((it, i) => <tr key={i}><td>{it.productName || it.product?.name}</td><td>{it.quantity}</td><td>₹{it.price.toLocaleString()}</td><td>₹{it.total.toLocaleString()}</td></tr>)}</tbody></table></div>
                </div></div>
            )}
        </div>
    );
};
export default RecurringInvoices;
