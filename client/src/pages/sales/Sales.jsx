import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { FiPlus, FiEye, FiDownload, FiX, FiTrash2 } from 'react-icons/fi';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        items: [{ product: '', quantity: 1 }],
        taxRate: 18,
        discount: 0,
        paymentStatus: 'pending',
        paymentMethod: 'cash',
        paidAmount: 0,
        customerName: '',
        customerPhone: '',
        notes: '',
    });

    useEffect(() => {
        fetchAll();
        if (searchParams.get('action') === 'new') setShowModal(true);
    }, []);

    const fetchAll = async () => {
        try {
            const [s, p] = await Promise.all([api.get('/sales'), api.get('/products')]);
            setSales(s.data.data);
            setProducts(p.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { product: '', quantity: 1 }] });
    const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
    const updateItem = (i, field, value) => {
        const items = [...form.items];
        items[i][field] = value;
        setForm({ ...form, items });
    };

    const calcSubtotal = () => {
        return form.items.reduce((sum, item) => {
            const prod = products.find(p => p._id === item.product);
            return sum + (prod ? prod.price * item.quantity : 0);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validItems = form.items.filter(i => i.product);
        if (validItems.length === 0) { setError('Add at least one product'); return; }
        try {
            await api.post('/sales', { ...form, items: validItems });
            setShowModal(false);
            setForm({ items: [{ product: '', quantity: 1 }], taxRate: 18, discount: 0, paymentStatus: 'pending', paymentMethod: 'cash', paidAmount: 0, customerName: '', customerPhone: '', notes: '' });
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Failed to create sale'); }
    };

    const downloadPDF = async (id) => {
        try {
            const res = await api.get(`/sales/${id}/invoice-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error(err); }
    };

    const [editingPayment, setEditingPayment] = useState(null);
    const [partialInput, setPartialInput] = useState(0);

    const updatePayment = async (id, status, paidAmt) => {
        try {
            await api.put(`/sales/${id}/payment`, { paymentStatus: status, paidAmount: paidAmt });
            setEditingPayment(null);
            fetchAll();
        } catch (err) { console.error(err); }
    };

    const handlePaymentChange = (sale, newStatus) => {
        if (newStatus === 'partial') {
            setEditingPayment(sale._id);
            setPartialInput(sale.paidAmount || 0);
        } else {
            updatePayment(sale._id, newStatus, newStatus === 'paid' ? sale.total : 0);
        }
    };

    const viewDetails = async (id) => {
        try {
            const res = await api.get(`/sales/${id}`);
            setShowDetail(res.data.data);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    const subtotal = calcSubtotal();
    const taxAmt = (subtotal * form.taxRate) / 100;
    const total = subtotal + taxAmt - form.discount;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Sales & Invoices</h1><p>{sales.length} sales records</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> New Sale</button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice #</th><th>Date</th><th>Customer</th><th>Items</th>
                            <th>Total</th><th>Paid</th><th>Balance</th><th>Payment</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(s => (
                            <tr key={s._id}>
                                <td><code>{s.invoiceNumber}</code></td>
                                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                <td>{s.customerName}</td>
                                <td>{s.items.length} items</td>
                                <td><strong>₹{s.total.toLocaleString()}</strong></td>
                                <td>
                                    <span className={s.paidAmount >= s.total ? 'text-success' : s.paidAmount > 0 ? 'text-warning' : 'text-danger'}>
                                        ₹{(s.paidAmount || 0).toLocaleString()}
                                    </span>
                                </td>
                                <td>
                                    {s.total - (s.paidAmount || 0) > 0 ? (
                                        <span className="text-danger">₹{(s.total - (s.paidAmount || 0)).toLocaleString()}</span>
                                    ) : <span className="text-success">—</span>}
                                </td>
                                <td>
                                    <div className="payment-cell">
                                        <select className={`badge-select badge-${s.paymentStatus}`}
                                            value={s.paymentStatus}
                                            onChange={(e) => handlePaymentChange(s, e.target.value)}>
                                            <option value="paid">Paid</option>
                                            <option value="pending">Pending</option>
                                            <option value="partial">Partial</option>
                                        </select>
                                        {editingPayment === s._id && (
                                            <div className="partial-input-row">
                                                <input type="number" className="partial-input" value={partialInput}
                                                    onChange={e => setPartialInput(parseFloat(e.target.value) || 0)}
                                                    max={s.total} min={0} placeholder="Amount paid" />
                                                <button className="btn btn-primary btn-sm" onClick={() => updatePayment(s._id, 'partial', partialInput)}>✓</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingPayment(null)}>✗</button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => viewDetails(s._id)} title="View"><FiEye /></button>
                                        <button className="btn-icon btn-primary-icon" onClick={() => downloadPDF(s._id)} title="Download PDF"><FiDownload /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sales.length === 0 && <div className="empty-state">No sales records found</div>}
            </div>

            {/* New Sale Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Sale</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group"><label>Customer Name</label>
                                    <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Walk-in Customer" />
                                </div>
                                <div className="form-group"><label>Phone</label>
                                    <input type="text" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
                                </div>
                            </div>

                            <h4>Products</h4>
                            {form.items.map((item, i) => (
                                <div key={i} className="form-row item-row">
                                    <div className="form-group" style={{ flex: 3 }}>
                                        <select value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                                            <option value="">Select product</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id}>{p.name} (₹{p.price} — Stock: {p.quantity})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))} min="1" placeholder="Qty" required />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <span className="item-total">₹{((products.find(p => p._id === item.product)?.price || 0) * item.quantity).toLocaleString()}</span>
                                    </div>
                                    {form.items.length > 1 && (
                                        <button type="button" className="btn-icon btn-delete" onClick={() => removeItem(i)}><FiTrash2 /></button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><FiPlus /> Add Item</button>

                            <div className="form-row" style={{ marginTop: '1rem' }}>
                                <div className="form-group"><label>Tax Rate (%)</label>
                                    <input type="number" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: parseFloat(e.target.value) })} min="0" />
                                </div>
                                <div className="form-group"><label>Discount (₹)</label>
                                    <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) })} min="0" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Payment Status</label>
                                    <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                                        <option value="paid">Paid</option><option value="pending">Pending</option><option value="partial">Partial</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Payment Method</label>
                                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                                        <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            {/* Partial Payment Amount */}
                            {form.paymentStatus === 'partial' && (
                                <div className="form-group partial-amount-group">
                                    <label>💰 Amount Paid (₹)</label>
                                    <input type="number" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                                        min="0" max={total} placeholder="Enter amount received" />
                                    <div className="partial-info">
                                        <span>Remaining: <strong className="text-danger">₹{(total - (form.paidAmount || 0)).toLocaleString()}</strong></span>
                                        <span>Paid: <strong className="text-success">{total > 0 ? ((form.paidAmount / total) * 100).toFixed(1) : 0}%</strong></span>
                                    </div>
                                </div>
                            )}

                            <div className="sale-summary">
                                <div><span>Subtotal:</span><span>₹{subtotal.toLocaleString()}</span></div>
                                <div><span>Tax ({form.taxRate}%):</span><span>₹{taxAmt.toLocaleString()}</span></div>
                                <div><span>Discount:</span><span>-₹{form.discount.toLocaleString()}</span></div>
                                <div className="sale-total"><span>Total:</span><span>₹{total.toLocaleString()}</span></div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Sale</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sale Detail Modal */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Invoice {showDetail.invoiceNumber}</h3>
                            <button className="btn-icon" onClick={() => setShowDetail(null)}><FiX /></button>
                        </div>
                        <div className="invoice-detail">
                            <div className="detail-row"><span>Date:</span><span>{new Date(showDetail.createdAt).toLocaleString()}</span></div>
                            <div className="detail-row"><span>Customer:</span><span>{showDetail.customerName}</span></div>
                            <div className="detail-row"><span>Payment:</span><span className={`badge badge-${showDetail.paymentStatus === 'paid' ? 'success' : showDetail.paymentStatus === 'partial' ? 'warning' : 'danger'}`}>{showDetail.paymentStatus}</span></div>
                            {showDetail.paymentStatus === 'partial' && (
                                <div className="detail-row"><span>💰 Paid:</span><span className="text-success">₹{(showDetail.paidAmount || 0).toLocaleString()} / ₹{showDetail.total.toLocaleString()}</span></div>
                            )}
                            {showDetail.paymentStatus === 'partial' && (
                                <div className="partial-progress-bar">
                                    <div className="progress-fill" style={{ width: `${((showDetail.paidAmount || 0) / showDetail.total * 100)}%` }}></div>
                                </div>
                            )}
                            <h4>Items</h4>
                            <table className="detail-table">
                                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                                <tbody>
                                    {showDetail.items.map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.productName}</td><td>{item.quantity}</td>
                                            <td>₹{item.price.toLocaleString()}</td><td>₹{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="sale-summary">
                                <div><span>Subtotal:</span><span>₹{showDetail.subtotal.toLocaleString()}</span></div>
                                <div><span>Tax ({showDetail.taxRate}%):</span><span>₹{showDetail.taxAmount.toLocaleString()}</span></div>
                                <div><span>Discount:</span><span>-₹{showDetail.discount.toLocaleString()}</span></div>
                                <div className="sale-total"><span>Total:</span><span>₹{showDetail.total.toLocaleString()}</span></div>
                            </div>
                            <button className="btn btn-primary" onClick={() => downloadPDF(showDetail._id)} style={{ marginTop: '1rem', width: '100%' }}>
                                <FiDownload /> Download Invoice PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
