import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
    FiDollarSign, FiCalendar, FiCheckCircle, FiClock,
    FiPlay, FiCreditCard, FiTrash2, FiEdit2, FiX, FiDownload,
    FiUsers, FiTrendingUp, FiRefreshCw
} from 'react-icons/fi';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const Payroll = () => {
    const now = new Date();
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [statusFilter, setStatusFilter] = useState('');
    const [summary, setSummary] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [showEdit, setShowEdit] = useState(null);   // payroll obj for editing
    const [editForm, setEditForm] = useState({});
    const [showPayslip, setShowPayslip] = useState(null);

    useEffect(() => { fetchData(); }, [month, year, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ month, year });
            if (statusFilter) params.append('status', statusFilter);

            const [pRes, sRes] = await Promise.all([
                api.get(`/payroll?${params}`),
                api.get(`/payroll/summary?month=${month}&year=${year}`),
            ]);
            setPayrolls(pRes.data.data);
            setSummary(sRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!window.confirm(`Generate payroll for ${MONTHS[month - 1]} ${year} for all active employees?`)) return;
        setGenerating(true);
        try {
            const res = await api.post('/payroll/generate', { month, year });
            alert(res.data.message);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate');
        } finally {
            setGenerating(false);
        }
    };

    const handleProcess = async (id) => {
        try {
            await api.put(`/payroll/${id}/process`);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handlePay = async (id) => {
        if (!window.confirm('Mark this payroll as PAID?')) return;
        try {
            await api.put(`/payroll/${id}/pay`);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this payroll record?')) return;
        try {
            await api.delete(`/payroll/${id}`);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
    };

    // Edit modal
    const openEdit = (p) => {
        setEditForm({
            hra: p.allowances.hra, transport: p.allowances.transport,
            medical: p.allowances.medical, otherAllow: p.allowances.other,
            tax: p.deductions.tax, pf: p.deductions.pf,
            insurance: p.deductions.insurance, otherDeduct: p.deductions.other,
            notes: p.notes || '',
        });
        setShowEdit(p);
    };

    const saveEdit = async () => {
        try {
            await api.put(`/payroll/${showEdit._id}`, {
                allowances: {
                    hra: Number(editForm.hra) || 0,
                    transport: Number(editForm.transport) || 0,
                    medical: Number(editForm.medical) || 0,
                    other: Number(editForm.otherAllow) || 0,
                },
                deductions: {
                    tax: Number(editForm.tax) || 0,
                    pf: Number(editForm.pf) || 0,
                    insurance: Number(editForm.insurance) || 0,
                    other: Number(editForm.otherDeduct) || 0,
                },
                notes: editForm.notes,
            });
            setShowEdit(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving');
        }
    };

    const statusBadge = (s) => {
        const cls = s === 'paid' ? 'badge-success' : s === 'processed' ? 'badge-warning' : 'badge-info';
        return <span className={`badge ${cls}`}>{s.toUpperCase()}</span>;
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Payroll Management</h1>
                    <p>Manage employee salaries and payslips</p>
                </div>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                    {generating ? <><FiRefreshCw className="spin" /> Generating...</> : <><FiDollarSign /> Generate Payroll</>}
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="stats-grid">
                    <div className="stat-card stat-blue">
                        <div className="stat-icon"><FiUsers /></div>
                        <div className="stat-info">
                            <span className="stat-value">{summary.count}</span>
                            <span className="stat-label">Total Records</span>
                        </div>
                    </div>
                    <div className="stat-card stat-green">
                        <div className="stat-icon"><FiDollarSign /></div>
                        <div className="stat-info">
                            <span className="stat-value">₹{summary.totalNet.toLocaleString()}</span>
                            <span className="stat-label">Net Payout</span>
                        </div>
                    </div>
                    <div className="stat-card stat-purple">
                        <div className="stat-icon"><FiTrendingUp /></div>
                        <div className="stat-info">
                            <span className="stat-value">₹{summary.totalAllowances.toLocaleString()}</span>
                            <span className="stat-label">Total Allowances</span>
                        </div>
                    </div>
                    <div className="stat-card stat-yellow">
                        <div className="stat-icon"><FiCreditCard /></div>
                        <div className="stat-info">
                            <span className="stat-value">{summary.byStatus.paid}/{summary.count}</span>
                            <span className="stat-label">Paid</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-bar">
                <div className="payroll-period-selectors">
                    <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                </select>
            </div>

            {/* Payroll Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Base Salary</th>
                            <th>Allowances</th>
                            <th>Deductions</th>
                            <th>Net Salary</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.map(p => (
                            <tr key={p._id}>
                                <td>
                                    <strong>{p.employee?.name}</strong>
                                    <br /><small style={{ color: 'var(--text-muted)' }}>{p.employee?.position}</small>
                                </td>
                                <td>{p.employee?.department}</td>
                                <td>₹{p.baseSalary.toLocaleString()}</td>
                                <td style={{ color: 'var(--success)' }}>+₹{p.totalAllowances.toLocaleString()}</td>
                                <td style={{ color: 'var(--danger)' }}>-₹{p.totalDeductions.toLocaleString()}</td>
                                <td><strong>₹{p.netSalary.toLocaleString()}</strong></td>
                                <td>{statusBadge(p.status)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" title="View Payslip" onClick={() => setShowPayslip(p)}>
                                            <FiDownload />
                                        </button>
                                        {p.status === 'draft' && (
                                            <>
                                                <button className="btn-icon btn-edit" title="Edit" onClick={() => openEdit(p)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button className="btn-icon" title="Process" onClick={() => handleProcess(p._id)}
                                                    style={{ color: 'var(--warning)' }}>
                                                    <FiPlay />
                                                </button>
                                            </>
                                        )}
                                        {p.status === 'processed' && (
                                            <button className="btn-icon" title="Mark Paid" onClick={() => handlePay(p._id)}
                                                style={{ color: 'var(--success)' }}>
                                                <FiCheckCircle />
                                            </button>
                                        )}
                                        {p.status !== 'paid' && (
                                            <button className="btn-icon btn-delete" title="Delete" onClick={() => handleDelete(p._id)}>
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {payrolls.length === 0 && (
                    <div className="empty-state">
                        No payroll records for {MONTHS[month - 1]} {year}.<br />
                        Click "Generate Payroll" to create records for all active employees.
                    </div>
                )}
            </div>

            {/* ---- Edit Modal ---- */}
            {showEdit && (
                <div className="modal-overlay" onClick={() => setShowEdit(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Payroll — {showEdit.employee?.name}</h3>
                            <button className="btn-icon" onClick={() => setShowEdit(null)}><FiX /></button>
                        </div>
                        <div className="modal-form">
                            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Base Salary: ₹{showEdit.baseSalary.toLocaleString()}</p>
                            <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--success)' }}>Allowances</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>HRA</label>
                                    <input type="number" value={editForm.hra} onChange={e => setEditForm({ ...editForm, hra: e.target.value })} min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Transport</label>
                                    <input type="number" value={editForm.transport} onChange={e => setEditForm({ ...editForm, transport: e.target.value })} min="0" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Medical</label>
                                    <input type="number" value={editForm.medical} onChange={e => setEditForm({ ...editForm, medical: e.target.value })} min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Other Allowance</label>
                                    <input type="number" value={editForm.otherAllow} onChange={e => setEditForm({ ...editForm, otherAllow: e.target.value })} min="0" />
                                </div>
                            </div>
                            <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--danger)' }}>Deductions</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tax</label>
                                    <input type="number" value={editForm.tax} onChange={e => setEditForm({ ...editForm, tax: e.target.value })} min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Provident Fund</label>
                                    <input type="number" value={editForm.pf} onChange={e => setEditForm({ ...editForm, pf: e.target.value })} min="0" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Insurance</label>
                                    <input type="number" value={editForm.insurance} onChange={e => setEditForm({ ...editForm, insurance: e.target.value })} min="0" />
                                </div>
                                <div className="form-group">
                                    <label>Other Deduction</label>
                                    <input type="number" value={editForm.otherDeduct} onChange={e => setEditForm({ ...editForm, otherDeduct: e.target.value })} min="0" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows="2" />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Payslip Modal ---- */}
            {showPayslip && (
                <div className="modal-overlay" onClick={() => setShowPayslip(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Payslip — {MONTHS[month - 1]} {year}</h3>
                            <button className="btn-icon" onClick={() => setShowPayslip(null)}><FiX /></button>
                        </div>
                        <div className="payslip-content">
                            <div className="payslip-header-info">
                                <div>
                                    <h4>{showPayslip.employee?.name}</h4>
                                    <p>{showPayslip.employee?.position} — {showPayslip.employee?.department}</p>
                                </div>
                                <div>{statusBadge(showPayslip.status)}</div>
                            </div>
                            <div className="payslip-table">
                                <div className="payslip-section">
                                    <h5>Earnings</h5>
                                    <div className="payslip-row"><span>Base Salary</span><span>₹{showPayslip.baseSalary.toLocaleString()}</span></div>
                                    <div className="payslip-row"><span>HRA</span><span>₹{showPayslip.allowances.hra.toLocaleString()}</span></div>
                                    <div className="payslip-row"><span>Transport</span><span>₹{showPayslip.allowances.transport.toLocaleString()}</span></div>
                                    <div className="payslip-row"><span>Medical</span><span>₹{showPayslip.allowances.medical.toLocaleString()}</span></div>
                                    {showPayslip.allowances.other > 0 && <div className="payslip-row"><span>Other</span><span>₹{showPayslip.allowances.other.toLocaleString()}</span></div>}
                                    <div className="payslip-row payslip-total"><span>Total Earnings</span><span>₹{(showPayslip.baseSalary + showPayslip.totalAllowances).toLocaleString()}</span></div>
                                </div>
                                <div className="payslip-section">
                                    <h5>Deductions</h5>
                                    <div className="payslip-row"><span>Income Tax</span><span>₹{showPayslip.deductions.tax.toLocaleString()}</span></div>
                                    <div className="payslip-row"><span>Provident Fund</span><span>₹{showPayslip.deductions.pf.toLocaleString()}</span></div>
                                    {showPayslip.deductions.insurance > 0 && <div className="payslip-row"><span>Insurance</span><span>₹{showPayslip.deductions.insurance.toLocaleString()}</span></div>}
                                    {showPayslip.deductions.other > 0 && <div className="payslip-row"><span>Other</span><span>₹{showPayslip.deductions.other.toLocaleString()}</span></div>}
                                    <div className="payslip-row payslip-total"><span>Total Deductions</span><span>₹{showPayslip.totalDeductions.toLocaleString()}</span></div>
                                </div>
                            </div>
                            <div className="payslip-net">
                                <span>Net Salary</span>
                                <span>₹{showPayslip.netSalary.toLocaleString()}</span>
                            </div>
                            {showPayslip.paidDate && (
                                <p className="payslip-paid-date">Paid on: {new Date(showPayslip.paidDate).toLocaleDateString()}</p>
                            )}
                            {showPayslip.notes && <p className="payslip-notes"><strong>Notes:</strong> {showPayslip.notes}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
