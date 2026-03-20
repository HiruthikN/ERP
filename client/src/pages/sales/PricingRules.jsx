import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const PricingRules = () => {
    const [rules, setRules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editRule, setEditRule] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'percentage', value: '', appliesTo: 'all', targetCategory: '', targetProduct: '', minQuantity: 1, startDate: '', endDate: '' });
    const [error, setError] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [r, c, p] = await Promise.all([api.get('/pricing-rules'), api.get('/categories'), api.get('/products')]);
            setRules(r.data.data);
            setCategories(c.data.data);
            setProducts(p.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openModal = (rule = null) => {
        if (rule) {
            setEditRule(rule);
            setForm({
                name: rule.name, type: rule.type, value: rule.value, appliesTo: rule.appliesTo,
                targetCategory: rule.targetCategory?._id || '', targetProduct: rule.targetProduct?._id || '',
                minQuantity: rule.minQuantity, startDate: rule.startDate ? rule.startDate.slice(0, 10) : '',
                endDate: rule.endDate ? rule.endDate.slice(0, 10) : '',
            });
        } else {
            setEditRule(null);
            setForm({ name: '', type: 'percentage', value: '', appliesTo: 'all', targetCategory: '', targetProduct: '', minQuantity: 1, startDate: '', endDate: '' });
        }
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) return setError('Rule name is required');
        if (!form.value) return setError('Value is required');

        const body = { ...form };
        if (body.appliesTo !== 'category') delete body.targetCategory;
        if (body.appliesTo !== 'product') delete body.targetProduct;
        if (!body.startDate) delete body.startDate;
        if (!body.endDate) delete body.endDate;

        try {
            if (editRule) {
                await api.put(`/pricing-rules/${editRule._id}`, body);
            } else {
                await api.post('/pricing-rules', body);
            }
            setShowModal(false);
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this rule?')) return;
        try { await api.delete(`/pricing-rules/${id}`); fetchAll(); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleToggle = async (id) => {
        try { await api.put(`/pricing-rules/${id}/toggle`); fetchAll(); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Pricing & Discounts</h1><p>{rules.length} pricing rules</p></div>
                <button className="btn btn-primary" onClick={() => openModal()}><FiPlus /> New Rule</button>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Applies To</th><th>Min Qty</th><th>Date Range</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        {rules.map(r => (
                            <tr key={r._id}>
                                <td><strong>{r.name}</strong></td>
                                <td>{r.type}</td>
                                <td>{r.type === 'percentage' ? `${r.value}%` : `₹${r.value}`}</td>
                                <td>
                                    {r.appliesTo === 'all' && 'All Products'}
                                    {r.appliesTo === 'category' && `Category: ${r.targetCategory?.name || '—'}`}
                                    {r.appliesTo === 'product' && `Product: ${r.targetProduct?.name || '—'}`}
                                </td>
                                <td>{r.minQuantity}</td>
                                <td>
                                    {r.startDate || r.endDate ? `${r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'} → ${r.endDate ? new Date(r.endDate).toLocaleDateString() : '—'}` : 'Always'}
                                </td>
                                <td>
                                    <button className="btn-icon" onClick={() => handleToggle(r._id)} title={r.active ? 'Active' : 'Inactive'} style={{ color: r.active ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {r.active ? <FiToggleRight /> : <FiToggleLeft />}
                                    </button>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => openModal(r)}><FiEdit2 /></button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(r._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rules.length === 0 && <div className="empty-state">No pricing rules. Create one to apply automatic discounts.</div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editRule ? 'Edit' : 'New'} Pricing Rule</h3><button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button></div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group"><label>Rule Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale 10%" /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Type</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Value *</label><input type="number" min="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 500'} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Applies To</label>
                                    <select value={form.appliesTo} onChange={e => setForm({ ...form, appliesTo: e.target.value })}>
                                        <option value="all">All Products</option>
                                        <option value="category">Specific Category</option>
                                        <option value="product">Specific Product</option>
                                    </select>
                                </div>
                                {form.appliesTo === 'category' && (
                                    <div className="form-group"><label>Category</label>
                                        <select value={form.targetCategory} onChange={e => setForm({ ...form, targetCategory: e.target.value })}>
                                            <option value="">Select</option>
                                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {form.appliesTo === 'product' && (
                                    <div className="form-group"><label>Product</label>
                                        <select value={form.targetProduct} onChange={e => setForm({ ...form, targetProduct: e.target.value })}>
                                            <option value="">Select</option>
                                            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Min Quantity</label><input type="number" min="1" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                                <div className="form-group"><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editRule ? 'Update' : 'Create'} Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingRules;
