import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiSend, FiCheckCircle, FiXCircle, FiArrowRight, FiTrash2, FiX, FiEye, FiAlertCircle } from 'react-icons/fi';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewQuote, setViewQuote] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', taxRate: 0, discount: 0, validUntil: '', notes: '' });
    const [items, setItems] = useState([{ product: '', quantity: 1, price: '' }]);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);

    useEffect(() => { fetchAll(); }, [statusFilter]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const [q, p] = await Promise.all([api.get(`/quotations${params}`), api.get('/products')]);
            setQuotations(q.data.data);
            setProducts(p.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const addItem = () => setItems([...items, { product: '', quantity: 1, price: '' }]);
    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i, field, value) => {
        const updated = [...items];
        updated[i][field] = value;
        if (field === 'product' && !updated[i].price) {
            const prod = products.find(p => p._id === value);
            if (prod) updated[i].price = prod.price;
        }
        setItems(updated);
    };

    const calcSubtotal = () => items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (items.some(i => !i.product)) return setError('Please select product for all items');
        const ve = {};
        if (form.customerPhone && !/^\d{10}$/.test(form.customerPhone)) ve.phone = 'Phone must be 10 digits';
        if (form.customerEmail && !/\S+@\S+\.\S+/.test(form.customerEmail)) ve.email = 'Invalid email format';
        setErrors(ve);
        if (Object.keys(ve).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); return; }
        try {
            await api.post('/quotations', { ...form, items: items.map(i => ({ product: i.product, quantity: Number(i.quantity), price: Number(i.price) })) });
            setShowModal(false);
            setItems([{ product: '', quantity: 1, price: '' }]);
            setForm({ customerName: '', customerPhone: '', customerEmail: '', taxRate: 0, discount: 0, validUntil: '', notes: '' });
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Failed to create'); }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'delete') {
                if (!window.confirm('Delete this quotation?')) return;
                await api.delete(`/quotations/${id}`);
            } else if (action === 'convert') {
                const res = await api.post(`/quotations/${id}/convert-to-order`);
                alert(res.data.message || 'Sales order created!');
            } else {
                await api.put(`/quotations/${id}/${action}`);
            }
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
    };

    const statusBadge = (s) => {
        const map = { draft: 'badge-info', sent: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', expired: 'badge-danger' };
        return <span className={`badge ${map[s] || ''}`}>{s.toUpperCase()}</span>;
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Quotations</h1><p>{quotations.length} quotations</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Quotation</button>
            </div>

            <div className="filters-bar">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Number</th><th>Customer</th><th>Items</th><th>Total</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {quotations.map(q => (
                            <tr key={q._id}>
                                <td><strong>{q.quotationNumber}</strong></td>
                                <td>{q.customerName}</td>
                                <td>{q.items.length}</td>
                                <td>₹{q.total.toLocaleString()}</td>
                                <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}</td>
                                <td>{statusBadge(q.status)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" title="View" onClick={() => setViewQuote(q)}><FiEye /></button>
                                        {q.status === 'draft' && <button className="btn-icon" title="Send" onClick={() => handleAction(q._id, 'send')} style={{ color: 'var(--primary)' }}><FiSend /></button>}
                                        {['draft', 'sent'].includes(q.status) && <button className="btn-icon" title="Approve" onClick={() => handleAction(q._id, 'approve')} style={{ color: 'var(--success)' }}><FiCheckCircle /></button>}
                                        {['draft', 'sent'].includes(q.status) && <button className="btn-icon" title="Reject" onClick={() => handleAction(q._id, 'reject')} style={{ color: 'var(--danger)' }}><FiXCircle /></button>}
                                        {q.status === 'approved' && <button className="btn-icon" title="Convert to Order" onClick={() => handleAction(q._id, 'convert')} style={{ color: 'var(--success)' }}><FiArrowRight /></button>}
                                        {q.status !== 'approved' && <button className="btn-icon btn-delete" title="Delete" onClick={() => handleAction(q._id, 'delete')}><FiTrash2 /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {quotations.length === 0 && <div className="empty-state">No quotations found</div>}
            </div>

            {/* View Modal */}
            {viewQuote && (
                <div className="modal-overlay" onClick={() => setViewQuote(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Quotation {viewQuote.quotationNumber}</h3><button className="btn-icon" onClick={() => setViewQuote(null)}><FiX /></button></div>
                        <div className="payslip-content">
                            <div className="payslip-header-info"><div><h4>{viewQuote.customerName}</h4><p>{viewQuote.customerPhone} {viewQuote.customerEmail && `• ${viewQuote.customerEmail}`}</p></div><div>{statusBadge(viewQuote.status)}</div></div>
                            <div className="table-container">
                                <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                                    <tbody>{viewQuote.items.map((it, i) => (<tr key={i}><td>{it.productName}</td><td>{it.quantity}</td><td>₹{it.price.toLocaleString()}</td><td>₹{it.total.toLocaleString()}</td></tr>))}</tbody>
                                </table>
                            </div>
                            <div className="payslip-net"><span>Total</span><span>₹{viewQuote.total.toLocaleString()}</span></div>
                            {viewQuote.notes && <p className="payslip-notes"><strong>Notes:</strong> {viewQuote.notes}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header"><h3>New Quotation</h3><button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button></div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group"><label>Customer Name</label><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Walk-in Customer" /></div>
                                <div className={`form-group ${errors.phone ? 'has-error' : ''}`}><label>Phone</label><input type="text" value={form.customerPhone} onChange={e => { setForm({ ...form, customerPhone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }} placeholder="10-digit number" />{errors.phone && <span className="form-error-text"><FiAlertCircle size={12} />{errors.phone}</span>}</div>
                            </div>
                            <div className="form-row">
                                <div className={`form-group ${errors.email ? 'has-error' : ''}`}><label>Email</label><input type="email" value={form.customerEmail} onChange={e => { setForm({ ...form, customerEmail: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }} />{errors.email && <span className="form-error-text"><FiAlertCircle size={12} />{errors.email}</span>}</div>
                                <div className="form-group"><label>Valid Until</label><input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} /></div>
                            </div>
                            <h4 style={{ marginBottom: '0.5rem' }}>Items</h4>
                            {items.map((item, i) => (
                                <div className="form-row" key={i} style={{ alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ flex: 2 }}><label>Product</label>
                                        <select value={item.product} onChange={e => updateItem(i, 'product', e.target.value)}>
                                            <option value="">Select</option>
                                            {products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Qty</label><input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></div>
                                    <div className="form-group"><label>Price</label><input type="number" min="0" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} /></div>
                                    <button type="button" className="btn-icon btn-delete" onClick={() => removeItem(i)} style={{ marginBottom: '0.5rem' }}><FiTrash2 /></button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary" onClick={addItem} style={{ marginBottom: '1rem' }}><FiPlus /> Add Item</button>
                            <div className="form-row">
                                <div className="form-group"><label>Tax Rate (%)</label><input type="number" min="0" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} /></div>
                                <div className="form-group"><label>Discount (₹)</label><input type="number" min="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></div>
                            </div>
                            <p style={{ fontWeight: 600, margin: '0.5rem 0' }}>Subtotal: ₹{calcSubtotal().toLocaleString()}</p>
                            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="2" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Quotation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;
