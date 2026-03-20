import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiCheckCircle, FiXCircle, FiFileText, FiTruck, FiTrash2, FiX, FiEye, FiAlertCircle } from 'react-icons/fi';

const SalesOrders = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [form, setForm] = useState({ customerName: '', customerPhone: '', taxRate: 0, discount: 0, notes: '' });
    const [items, setItems] = useState([{ product: '', quantity: 1, price: '' }]);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);

    useEffect(() => { fetchAll(); }, [statusFilter]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const [o, p] = await Promise.all([api.get(`/sales-orders${params}`), api.get('/products')]);
            setOrders(o.data.data);
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
        if (items.some(i => !i.product)) return setError('Select product for all items');
        const ve = {};
        if (form.customerPhone && !/^\d{10}$/.test(form.customerPhone)) ve.phone = 'Phone must be 10 digits';
        setErrors(ve);
        if (Object.keys(ve).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); return; }
        try {
            await api.post('/sales-orders', { ...form, items: items.map(i => ({ product: i.product, quantity: Number(i.quantity), price: Number(i.price) })) });
            setShowModal(false);
            setItems([{ product: '', quantity: 1, price: '' }]);
            setForm({ customerName: '', customerPhone: '', taxRate: 0, discount: 0, notes: '' });
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'delete') { if (!window.confirm('Delete?')) return; await api.delete(`/sales-orders/${id}`); }
            else if (action === 'create-invoice') { const r = await api.post(`/sales-orders/${id}/create-invoice`); alert(r.data.message || 'Invoice created!'); }
            else if (action === 'create-delivery') { const r = await api.post(`/sales-orders/${id}/create-delivery`); alert(r.data.message || 'Delivery note created!'); }
            else { await api.put(`/sales-orders/${id}/${action}`); }
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
    };

    const statusBadge = (s) => {
        const map = { draft: 'badge-info', confirmed: 'badge-warning', delivered: 'badge-success', invoiced: 'badge-success', cancelled: 'badge-danger' };
        return <span className={`badge ${map[s] || ''}`}>{s.toUpperCase()}</span>;
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Sales Orders</h1><p>{orders.length} orders</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Order</button>
            </div>

            <div className="filters-bar">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Order #</th><th>From</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o._id}>
                                <td><strong>{o.orderNumber}</strong></td>
                                <td>{o.quotation?.quotationNumber || '—'}</td>
                                <td>{o.customerName}</td>
                                <td>{o.items.length}</td>
                                <td>₹{o.total.toLocaleString()}</td>
                                <td>{statusBadge(o.status)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" title="View" onClick={() => setViewOrder(o)}><FiEye /></button>
                                        {o.status === 'draft' && <button className="btn-icon" title="Confirm" onClick={() => handleAction(o._id, 'confirm')} style={{ color: 'var(--success)' }}><FiCheckCircle /></button>}
                                        {['confirmed', 'delivered'].includes(o.status) && <button className="btn-icon" title="Create Invoice" onClick={() => handleAction(o._id, 'create-invoice')} style={{ color: 'var(--primary)' }}><FiFileText /></button>}
                                        {['confirmed', 'invoiced'].includes(o.status) && <button className="btn-icon" title="Create Delivery" onClick={() => handleAction(o._id, 'create-delivery')} style={{ color: 'var(--warning)' }}><FiTruck /></button>}
                                        {!['invoiced'].includes(o.status) && <button className="btn-icon" title="Cancel" onClick={() => handleAction(o._id, 'cancel')} style={{ color: 'var(--danger)' }}><FiXCircle /></button>}
                                        {['draft', 'cancelled'].includes(o.status) && <button className="btn-icon btn-delete" onClick={() => handleAction(o._id, 'delete')}><FiTrash2 /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && <div className="empty-state">No sales orders found</div>}
            </div>

            {/* View Modal */}
            {viewOrder && (
                <div className="modal-overlay" onClick={() => setViewOrder(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Order {viewOrder.orderNumber}</h3><button className="btn-icon" onClick={() => setViewOrder(null)}><FiX /></button></div>
                        <div className="payslip-content">
                            <div className="payslip-header-info"><div><h4>{viewOrder.customerName}</h4>{viewOrder.quotation && <p>From: {viewOrder.quotation.quotationNumber}</p>}</div><div>{statusBadge(viewOrder.status)}</div></div>
                            <div className="table-container">
                                <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                                    <tbody>{viewOrder.items.map((it, i) => (<tr key={i}><td>{it.productName}</td><td>{it.quantity}</td><td>₹{it.price.toLocaleString()}</td><td>₹{it.total.toLocaleString()}</td></tr>))}</tbody>
                                </table>
                            </div>
                            <div className="payslip-net"><span>Total</span><span>₹{viewOrder.total.toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className={`modal ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header"><h3>New Sales Order</h3><button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button></div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group"><label>Customer Name</label><input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
                                <div className={`form-group ${errors.phone ? 'has-error' : ''}`}><label>Phone</label><input type="text" value={form.customerPhone} onChange={e => { setForm({ ...form, customerPhone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }} placeholder="10-digit number" />{errors.phone && <span className="form-error-text"><FiAlertCircle size={12} />{errors.phone}</span>}</div>
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
                            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="2" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesOrders;
