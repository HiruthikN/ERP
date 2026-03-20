import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiTrash2, FiX, FiEye, FiDownload } from 'react-icons/fi';

const CreditNotes = () => {
    const [notes, setNotes] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewNote, setViewNote] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [form, setForm] = useState({ invoice: '', reason: 'return', notes: '' });
    const [items, setItems] = useState([{ product: '', quantity: 1, price: '' }]);
    const [error, setError] = useState('');

    useEffect(() => { fetchAll(); }, [statusFilter]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const [cn, inv, p] = await Promise.all([api.get(`/credit-notes${params}`), api.get('/sales'), api.get('/products')]);
            setNotes(cn.data.data);
            setInvoices(inv.data.data);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.invoice) return setError('Select an invoice');
        if (items.some(i => !i.product)) return setError('Select product for all items');
        try {
            await api.post('/credit-notes', { ...form, items: items.map(i => ({ product: i.product, quantity: Number(i.quantity), price: Number(i.price) })) });
            setShowModal(false);
            setItems([{ product: '', quantity: 1, price: '' }]);
            setForm({ invoice: '', reason: 'return', notes: '' });
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'delete') { if (!window.confirm('Delete?')) return; await api.delete(`/credit-notes/${id}`); }
            else { await api.put(`/credit-notes/${id}/${action}`); }
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const statusBadge = (s) => {
        const map = { draft: 'badge-info', issued: 'badge-warning', applied: 'badge-success' };
        return <span className={`badge ${map[s] || ''}`}>{s.toUpperCase()}</span>;
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Credit Notes</h1><p>{notes.length} credit notes</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Credit Note</button>
            </div>

            <div className="filters-bar">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                    <option value="applied">Applied</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Credit #</th><th>Invoice</th><th>Customer</th><th>Reason</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {notes.map(cn => (
                            <tr key={cn._id}>
                                <td><strong>{cn.creditNumber}</strong></td>
                                <td>{cn.invoice?.invoiceNumber || '—'}</td>
                                <td>{cn.customerName}</td>
                                <td>{cn.reason}</td>
                                <td>₹{cn.total.toLocaleString()}</td>
                                <td>{statusBadge(cn.status)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" title="View" onClick={() => setViewNote(cn)}><FiEye /></button>
                                        {cn.status === 'draft' && <button className="btn-icon" title="Issue" onClick={() => handleAction(cn._id, 'issue')} style={{ color: 'var(--warning)' }}><FiDownload /></button>}
                                        {cn.status === 'issued' && <button className="btn-icon" title="Apply (restore stock)" onClick={() => handleAction(cn._id, 'apply')} style={{ color: 'var(--success)' }}>✓</button>}
                                        {cn.status !== 'applied' && <button className="btn-icon btn-delete" onClick={() => handleAction(cn._id, 'delete')}><FiTrash2 /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {notes.length === 0 && <div className="empty-state">No credit notes found</div>}
            </div>

            {/* View Modal */}
            {viewNote && (
                <div className="modal-overlay" onClick={() => setViewNote(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Credit Note {viewNote.creditNumber}</h3><button className="btn-icon" onClick={() => setViewNote(null)}><FiX /></button></div>
                        <div className="payslip-content">
                            <div className="payslip-header-info"><div><h4>{viewNote.customerName}</h4><p>Invoice: {viewNote.invoice?.invoiceNumber} • Reason: {viewNote.reason}</p></div><div>{statusBadge(viewNote.status)}</div></div>
                            <div className="table-container">
                                <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                                    <tbody>{viewNote.items.map((it, i) => (<tr key={i}><td>{it.productName}</td><td>{it.quantity}</td><td>₹{it.price.toLocaleString()}</td><td>₹{it.total.toLocaleString()}</td></tr>))}</tbody>
                                </table>
                            </div>
                            <div className="payslip-net"><span>Credit Total</span><span>₹{viewNote.total.toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header"><h3>New Credit Note</h3><button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button></div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group"><label>Invoice *</label>
                                    <select value={form.invoice} onChange={e => setForm({ ...form, invoice: e.target.value })}>
                                        <option value="">Select invoice</option>
                                        {invoices.map(inv => <option key={inv._id} value={inv._id}>{inv.invoiceNumber} — {inv.customerName} (₹{inv.total.toLocaleString()})</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Reason</label>
                                    <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                                        <option value="return">Return</option>
                                        <option value="damaged">Damaged</option>
                                        <option value="overcharge">Overcharge</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <h4 style={{ marginBottom: '0.5rem' }}>Items to Credit</h4>
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
                            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="2" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Credit Note</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditNotes;
