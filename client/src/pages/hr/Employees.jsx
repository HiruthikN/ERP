import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [error, setError] = useState('');
    const departments = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance', 'Operations', 'Support', 'Management'];

    const [form, setForm] = useState({
        name: '', email: '', phone: '', department: 'Engineering',
        position: '', salary: '', joiningDate: '', status: 'active', address: ''
    });

    useEffect(() => { fetch(); }, [search, filterDept]);

    const fetch = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterDept) params.append('department', filterDept);
            const res = await api.get(`/employees?${params}`);
            setEmployees(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openModal = (item = null) => {
        setEditItem(item);
        if (item) {
            setForm({
                name: item.name, email: item.email, phone: item.phone || '', department: item.department,
                position: item.position, salary: item.salary, joiningDate: item.joiningDate?.split('T')[0] || '',
                status: item.status, address: item.address || ''
            });
        } else {
            setForm({ name: '', email: '', phone: '', department: 'Engineering', position: '', salary: '', joiningDate: '', status: 'active', address: '' });
        }
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editItem) await api.put(`/employees/${editItem._id}`, form);
            else await api.post('/employees', form);
            setShowModal(false);
            fetch();
        } catch (err) { setError(err.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this employee?')) return;
        try { await api.delete(`/employees/${id}`); fetch(); }
        catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Employees</h1><p>{employees.length} employees</p></div>
                <button className="btn btn-primary" onClick={() => openModal()}><FiPlus /> Add Employee</button>
            </div>

            <div className="filters-bar">
                <div className="search-box"><FiSearch /><input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {employees.map(e => (
                            <tr key={e._id}>
                                <td><strong>{e.name}</strong></td>
                                <td>{e.email}</td>
                                <td><span className="badge badge-info">{e.department}</span></td>
                                <td>{e.position}</td>
                                <td>₹{e.salary.toLocaleString()}</td>
                                <td><span className={`badge badge-${e.status === 'active' ? 'success' : 'danger'}`}>{e.status}</span></td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon btn-edit" onClick={() => openModal(e)}><FiEdit2 /></button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(e._id)}><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {employees.length === 0 && <div className="empty-state">No employees found</div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editItem ? 'Edit' : 'Add'} Employee</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group"><label>Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Phone</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="form-group"><label>Department *</label>
                                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Position *</label><input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required /></div>
                                <div className="form-group"><label>Salary (₹) *</label><input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} required min="0" /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Joining Date</label><input type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} /></div>
                                <div className="form-group"><label>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="active">Active</option><option value="inactive">Inactive</option><option value="terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows="2" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'} Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
