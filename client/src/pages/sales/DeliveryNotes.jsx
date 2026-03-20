import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiTruck, FiCheckCircle, FiTrash2, FiX, FiEye } from 'react-icons/fi';

const DeliveryNotes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [viewNote, setViewNote] = useState(null);

    useEffect(() => { fetchAll(); }, [statusFilter]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const res = await api.get(`/delivery-notes${params}`);
            setNotes(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'delete') { if (!window.confirm('Delete?')) return; await api.delete(`/delivery-notes/${id}`); }
            else { await api.put(`/delivery-notes/${id}/${action}`); }
            fetchAll();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const statusBadge = (s) => {
        const map = { pending: 'badge-warning', shipped: 'badge-info', delivered: 'badge-success' };
        return <span className={`badge ${map[s] || ''}`}>{s.toUpperCase()}</span>;
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Delivery Notes</h1><p>{notes.length} delivery notes</p></div>
            </div>

            <div className="filters-bar">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Delivery #</th><th>Order #</th><th>Customer</th><th>Items</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {notes.map(n => (
                            <tr key={n._id}>
                                <td><strong>{n.deliveryNumber}</strong></td>
                                <td>{n.salesOrder?.orderNumber || '—'}</td>
                                <td>{n.customerName || n.salesOrder?.customerName}</td>
                                <td>{n.items.length}</td>
                                <td>{new Date(n.deliveryDate).toLocaleDateString()}</td>
                                <td>{statusBadge(n.status)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" title="View" onClick={() => setViewNote(n)}><FiEye /></button>
                                        {n.status === 'pending' && <button className="btn-icon" title="Ship" onClick={() => handleAction(n._id, 'ship')} style={{ color: 'var(--warning)' }}><FiTruck /></button>}
                                        {n.status === 'shipped' && <button className="btn-icon" title="Mark Delivered" onClick={() => handleAction(n._id, 'deliver')} style={{ color: 'var(--success)' }}><FiCheckCircle /></button>}
                                        {n.status !== 'delivered' && <button className="btn-icon btn-delete" onClick={() => handleAction(n._id, 'delete')}><FiTrash2 /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {notes.length === 0 && <div className="empty-state">No delivery notes. Create them from Sales Orders.</div>}
            </div>

            {viewNote && (
                <div className="modal-overlay" onClick={() => setViewNote(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Delivery {viewNote.deliveryNumber}</h3><button className="btn-icon" onClick={() => setViewNote(null)}><FiX /></button></div>
                        <div className="payslip-content">
                            <div className="payslip-header-info"><div><h4>{viewNote.customerName}</h4><p>Order: {viewNote.salesOrder?.orderNumber}</p></div><div>{statusBadge(viewNote.status)}</div></div>
                            <div className="table-container">
                                <table><thead><tr><th>Product</th><th>Qty Delivered</th></tr></thead>
                                    <tbody>{viewNote.items.map((it, i) => (<tr key={i}><td>{it.productName}</td><td>{it.quantity}</td></tr>))}</tbody>
                                </table>
                            </div>
                            {viewNote.shippingAddress && <p className="payslip-notes"><strong>Address:</strong> {viewNote.shippingAddress}</p>}
                            {viewNote.notes && <p className="payslip-notes"><strong>Notes:</strong> {viewNote.notes}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryNotes;
