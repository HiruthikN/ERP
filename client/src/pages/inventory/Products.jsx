import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const DEFAULT_UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'set', 'unit', 'pair', 'dozen'];

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [customUnits, setCustomUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState({
        name: '', sku: '', description: '', category: '', supplier: '',
        price: '', cost: '', quantity: '', unit: 'pcs'
    });
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Inline add states
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierEmail, setNewSupplierEmail] = useState('');
    const [addingSupplier, setAddingSupplier] = useState(false);

    const [showAddUnit, setShowAddUnit] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [p, c, s] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/suppliers'),
            ]);
            setProducts(p.data.data);
            setCategories(c.data.data);
            setSuppliers(s.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterCategory) params.append('category', filterCategory);
            const res = await api.get(`/products?${params}`);
            setProducts(res.data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { handleSearch(); }, [search, filterCategory]);

    const openModal = (product = null) => {
        if (product) {
            setEditProduct(product);
            setForm({
                name: product.name, sku: product.sku, description: product.description || '',
                category: product.category?._id || '', supplier: product.supplier?._id || '',
                price: product.price, cost: product.cost, quantity: product.quantity,
                unit: product.unit || 'pcs'
            });
        } else {
            setEditProduct(null);
            setForm({ name: '', sku: '', description: '', category: '', supplier: '', price: '', cost: '', quantity: '', unit: 'pcs' });
        }
        setError('');
        setFormErrors({});
        setShowAddCategory(false);
        setShowAddSupplier(false);
        setShowAddUnit(false);
        setShowModal(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name.trim()) errors.name = 'Product name is required';
        if (!form.sku.trim()) errors.sku = 'SKU is required';
        if (!form.category) errors.category = 'Please select a category';
        if (!form.price && form.price !== 0) errors.price = 'Price is required';
        if (form.price < 0) errors.price = 'Price must be positive';
        if (!form.quantity && form.quantity !== 0) errors.quantity = 'Quantity is required';
        if (form.quantity < 0) errors.quantity = 'Quantity must be positive';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

        const submitData = { ...form };
        if (!submitData.supplier) delete submitData.supplier;
        if (!submitData.cost) submitData.cost = 0;

        try {
            if (editProduct) {
                await api.put(`/products/${editProduct._id}`, submitData);
            } else {
                await api.post('/products', submitData);
            }
            setShowModal(false);
            fetchAll();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchAll();
        } catch (err) { console.error(err); }
    };

    // ---- Inline Add: Category ----
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setAddingCategory(true);
        try {
            const res = await api.post('/categories', { name: newCategoryName.trim() });
            const newCat = res.data.data;
            setCategories(prev => [...prev, newCat]);
            setForm(prev => ({ ...prev, category: newCat._id }));
            setNewCategoryName('');
            setShowAddCategory(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add category');
        } finally {
            setAddingCategory(false);
        }
    };

    // ---- Inline Add: Supplier ----
    const handleAddSupplier = async () => {
        if (!newSupplierName.trim()) return;
        setAddingSupplier(true);
        try {
            const body = { name: newSupplierName.trim() };
            if (newSupplierEmail.trim()) body.email = newSupplierEmail.trim();
            const res = await api.post('/suppliers', body);
            const newSup = res.data.data;
            setSuppliers(prev => [...prev, newSup]);
            setForm(prev => ({ ...prev, supplier: newSup._id }));
            setNewSupplierName('');
            setNewSupplierEmail('');
            setShowAddSupplier(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add supplier');
        } finally {
            setAddingSupplier(false);
        }
    };

    // ---- Inline Add: Unit ----
    const handleAddUnit = () => {
        if (!newUnitName.trim()) return;
        const u = newUnitName.trim().toLowerCase();
        if (!customUnits.includes(u) && !DEFAULT_UNITS.includes(u)) {
            setCustomUnits(prev => [...prev, u]);
        }
        setForm(prev => ({ ...prev, unit: u }));
        setNewUnitName('');
        setShowAddUnit(false);
    };

    const allUnits = [...DEFAULT_UNITS, ...customUnits];

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>{products.length} products in inventory</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <FiPlus /> Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <FiSearch />
                    <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Cost</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p._id}>
                                <td><strong>{p.name}</strong></td>
                                <td><code>{p.sku}</code></td>
                                <td>{p.category?.name || 'N/A'}</td>
                                <td>₹{p.price.toLocaleString()}</td>
                                <td>₹{p.cost.toLocaleString()}</td>
                                <td>{p.quantity} {p.unit}</td>
                                <td>
                                    {p.quantity <= 5 ? (
                                        <span className="badge badge-danger"><FiAlertTriangle /> Low Stock</span>
                                    ) : (
                                        <span className="badge badge-success">In Stock</span>
                                    )}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => openModal(p)}><FiEdit2 /></button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(p._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && <div className="empty-state">No products found</div>}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form" noValidate>
                            <div className="form-row">
                                <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                                    <label>Product Name *</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Laptop HP ProBook" />
                                    {formErrors.name && <span className="form-error-text"><FiAlertCircle size={12} />{formErrors.name}</span>}
                                </div>
                                <div className={`form-group ${formErrors.sku ? 'has-error' : ''}`}>
                                    <label>SKU *</label>
                                    <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. LAP-HP-001" />
                                    {formErrors.sku && <span className="form-error-text"><FiAlertCircle size={12} />{formErrors.sku}</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2" />
                            </div>

                            {/* ---- Category with inline add ---- */}
                            <div className="form-row">
                                <div className={`form-group ${formErrors.category ? 'has-error' : ''}`}>
                                    <label>Category *</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    {formErrors.category && <span className="form-error-text"><FiAlertCircle size={12} />{formErrors.category}</span>}
                                    {!showAddCategory ? (
                                        <button type="button" className="inline-add-btn" onClick={() => setShowAddCategory(true)}>
                                            <FiPlus /> Add New Category
                                        </button>
                                    ) : (
                                        <div className="inline-add-form">
                                            <input
                                                type="text"
                                                placeholder="Category name"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                                autoFocus
                                            />
                                            <button type="button" className="inline-add-confirm" onClick={handleAddCategory} disabled={addingCategory}>
                                                <FiCheck />
                                            </button>
                                            <button type="button" className="inline-add-cancel" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                                                <FiX />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ---- Supplier with inline add ---- */}
                                {/*<div className="form-group">
                                    <label>Supplier (optional)</label>
                                    <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                                        <option value="">Select supplier</option>
                                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                    {!showAddSupplier ? (
                                        <button type="button" className="inline-add-btn" onClick={() => setShowAddSupplier(true)}>
                                            <FiPlus /> Add New Supplier
                                        </button>
                                    ) : (
                                        <div className="inline-add-form">
                                            <input
                                                type="text"
                                                placeholder="Supplier name"
                                                value={newSupplierName}
                                                onChange={e => setNewSupplierName(e.target.value)}
                                                autoFocus
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email (optional)"
                                                value={newSupplierEmail}
                                                onChange={e => setNewSupplierEmail(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSupplier())}
                                            />
                                            <button type="button" className="inline-add-confirm" onClick={handleAddSupplier} disabled={addingSupplier}>
                                                <FiCheck />
                                            </button>
                                            <button type="button" className="inline-add-cancel" onClick={() => { setShowAddSupplier(false); setNewSupplierName(''); setNewSupplierEmail(''); }}>
                                                <FiX />
                                            </button>
                                        </div>
                                    )}
                                </div>*/}
                            </div>

                            <div className="form-row">
                                <div className={`form-group ${formErrors.price ? 'has-error' : ''}`}>
                                    <label>Price (₹) *</label>
                                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} min="0" placeholder="0" />
                                    {formErrors.price && <span className="form-error-text"><FiAlertCircle size={12} />{formErrors.price}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Cost (₹)</label>
                                    <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} min="0" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className={`form-group ${formErrors.quantity ? 'has-error' : ''}`}>
                                    <label>Quantity *</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} min="0" placeholder="0" />
                                    {formErrors.quantity && <span className="form-error-text"><FiAlertCircle size={12} />{formErrors.quantity}</span>}
                                </div>

                                {/* ---- Unit dropdown with inline add ---- */}
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                                        {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    {!showAddUnit ? (
                                        <button type="button" className="inline-add-btn" onClick={() => setShowAddUnit(true)}>
                                            <FiPlus /> Add New Unit
                                        </button>
                                    ) : (
                                        <div className="inline-add-form">
                                            <input
                                                type="text"
                                                placeholder="e.g. meter, roll"
                                                value={newUnitName}
                                                onChange={e => setNewUnitName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUnit())}
                                                autoFocus
                                            />
                                            <button type="button" className="inline-add-confirm" onClick={handleAddUnit}>
                                                <FiCheck />
                                            </button>
                                            <button type="button" className="inline-add-cancel" onClick={() => { setShowAddUnit(false); setNewUnitName(''); }}>
                                                <FiX />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editProduct ? 'Update' : 'Add'} Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
