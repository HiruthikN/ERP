import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertCircle } from 'react-icons/fi';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [formShake, setFormShake] = useState(false);

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        setForm(item ? { name: item.name, description: item.description || '' } : { name: '', description: '' });
        setError(''); setErrors({});
        setShowModal(true);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Category name is required';
        setErrors(e);
        if (Object.keys(e).length > 0) { setFormShake(true); setTimeout(() => setFormShake(false), 400); }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setError('');
        try {
            if (editItem) await api.put(`/categories/${editItem._id}`, form);
            else await api.post('/categories', form);
            setShowModal(false);
            fetch();
        } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try { await api.delete(`/categories/${id}`); fetch(); }
        catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Categories</h1><p>{categories.length} categories</p></div>
                <button className="btn btn-primary" onClick={() => openModal()}><FiPlus /> Add Category</button>
            </div>
            <div className="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                    <tbody>
                        {categories.map(c => (
                            <tr key={c._id}>
                                <td><strong>{c.name}</strong></td>
                                <td>{c.description || '-'}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => openModal(c)}><FiEdit2 /></button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(c._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {categories.length === 0 && <div className="empty-state">No categories found</div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className={`modal modal-sm ${formShake ? 'form-shake' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit' : 'Add'} Category</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form" noValidate>
                            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                                <label>Name *</label>
                                <input type="text" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} />
                                {errors.name && <span className="form-error-text"><FiAlertCircle size={12} />{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
