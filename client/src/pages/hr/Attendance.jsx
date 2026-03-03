import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiCalendar, FiFilter, FiX } from 'react-icons/fi';

const Attendance = () => {
    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('attendance'); // attendance | leaves
    const [filterEmp, setFilterEmp] = useState('');

    const [form, setForm] = useState({
        employee: '', date: new Date().toISOString().split('T')[0],
        status: 'present', leaveType: 'none', checkIn: '09:00', checkOut: '18:00', notes: ''
    });

    useEffect(() => { fetchAll(); }, [tab, filterEmp]);

    const fetchAll = async () => {
        try {
            const [empRes, attRes] = await Promise.all([
                api.get('/employees'),
                tab === 'leaves'
                    ? api.get('/attendance/leaves')
                    : api.get(`/attendance${filterEmp ? `?employee=${filterEmp}` : ''}`)
            ]);
            setEmployees(empRes.data.data);
            setRecords(attRes.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/attendance', form);
            setShowModal(false);
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Error'); }
    };

    const statusColors = { present: 'success', absent: 'danger', leave: 'warning', 'half-day': 'info' };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div><h1>Attendance & Leaves</h1><p>{records.length} records</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><FiPlus /> Mark Attendance</button>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}><FiCalendar /> Attendance</button>
                <button className={`tab ${tab === 'leaves' ? 'active' : ''}`} onClick={() => setTab('leaves')}><FiFilter /> Leaves</button>
            </div>

            {tab === 'attendance' && (
                <div className="filters-bar">
                    <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}>
                        <option value="">All Employees</option>
                        {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Status</th><th>Leave Type</th><th>Check In</th><th>Check Out</th></tr></thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r._id}>
                                <td><strong>{r.employee?.name || 'N/A'}</strong></td>
                                <td>{r.employee?.department || '-'}</td>
                                <td>{new Date(r.date).toLocaleDateString()}</td>
                                <td><span className={`badge badge-${statusColors[r.status]}`}>{r.status}</span></td>
                                <td>{r.leaveType !== 'none' ? r.leaveType : '-'}</td>
                                <td>{r.checkIn || '-'}</td>
                                <td>{r.checkOut || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {records.length === 0 && <div className="empty-state">No records found</div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Mark Attendance</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group"><label>Employee *</label>
                                <select value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} required>
                                    <option value="">Select employee</option>
                                    {employees.map(e => <option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label>Date *</label>
                                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-group"><label>Status *</label>
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="present">Present</option><option value="absent">Absent</option>
                                    <option value="leave">Leave</option><option value="half-day">Half Day</option>
                                </select>
                            </div>
                            {form.status === 'leave' && (
                                <div className="form-group"><label>Leave Type</label>
                                    <select value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
                                        <option value="sick">Sick</option><option value="casual">Casual</option>
                                        <option value="earned">Earned</option><option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                            )}
                            <div className="form-row">
                                <div className="form-group"><label>Check In</label><input type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} /></div>
                                <div className="form-group"><label>Check Out</label><input type="time" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="2" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
