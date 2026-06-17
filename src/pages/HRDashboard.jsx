import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/authService';
import {
  getAllEmployees,
  STATUS,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_STATUS_LABELS,
} from '../services/employeeService';
import { exportEmployeesToExcel } from '../services/exportService';
import CreateEmployeeForm from '../components/CreateEmployeeForm';
import EmployeeReviewPanel from '../components/EmployeeReviewPanel';
import AppHeader from '../components/AppHeader';

function employmentStatusOf(emp) {
  if (emp.employmentStatus) return emp.employmentStatus;
  if (emp.status === STATUS.APPROVED) return EMPLOYMENT_STATUS.ACTIVE;
  return null;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

export default function HRDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [listError, setListError] = useState('');

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setListError(err?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const employmentValues = Object.values(EMPLOYMENT_STATUS);

  const filtered = employees.filter((emp) => {
    if (filter === 'all') return true;
    if (employmentValues.includes(filter)) return employmentStatusOf(emp) === filter;
    return emp.status === filter;
  });

  const selected = employees.find((emp) => emp.id === selectedId);
  const pendingCount = employees.filter((emp) => emp.status === STATUS.SUBMITTED).length;
  const countEmployment = (value) => employees.filter((e) => employmentStatusOf(e) === value).length;

  const stats = [
    { label: 'Active', value: countEmployment(EMPLOYMENT_STATUS.ACTIVE), key: 'approved' },
    { label: 'Pending review', value: pendingCount, key: 'submitted' },
    { label: 'Resigned', value: countEmployment(EMPLOYMENT_STATUS.RESIGNED), key: 'invited' },
    { label: 'Absconded', value: countEmployment(EMPLOYMENT_STATUS.ABSCONDED), key: 'total' },
  ];

  function handleExport() {
    if (filtered.length === 0) return;
    const label = filter === 'all' ? 'all' : filter;
    exportEmployeesToExcel(filtered, label);
  }

  return (
    <div className="app dashboard-page">
      <AppHeader
        subtitle="HR Dashboard"
        userEmail={user.email}
        onLogout={handleLogout}
      />

      <div className="dashboard-stats">
        {stats.map((stat) => (
          <div key={stat.key} className={`stat-card stat-card--${stat.key}`}>
            <span className="stat-value">{loading ? '—' : stat.value}</span>
            <span className="stat-name">{stat.label}</span>
          </div>
        ))}
      </div>

      <main className="dashboard-layout">
        <section className="dashboard-main">
          <CreateEmployeeForm hrEmail={user.email} onCreated={loadEmployees} />

          <div className="card employee-list-card">
            <div className="list-header">
              <div className="list-header-titles">
                <h2>Employees</h2>
                {pendingCount > 0 && (
                  <span className="pending-badge">{pendingCount} pending review</span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm download-btn"
                onClick={handleExport}
                disabled={filtered.length === 0}
                title="Download the employees shown below as an Excel file"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Excel
              </button>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Onboarding</span>
              <div className="filter-tabs">
                {['all', STATUS.INVITED, STATUS.SUBMITTED, STATUS.APPROVED, STATUS.REJECTED].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`filter-tab ${filter === item ? 'active' : ''}`}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Workforce</span>
              <div className="filter-tabs">
                {Object.values(EMPLOYMENT_STATUS).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`filter-tab ${filter === item ? 'active' : ''}`}
                    onClick={() => setFilter(item)}
                  >
                    {EMPLOYMENT_STATUS_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            {listError && (
              <div className="alert alert-error" role="alert">
                {listError}
              </div>
            )}

            {loading ? (
              <p className="empty-state">Loading employees…</p>
            ) : filtered.length === 0 ? (
              <p className="empty-state">No employees found.</p>
            ) : (
              <div className="employee-table">
                {filtered.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    className={`employee-row ${selectedId === emp.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(emp.id)}
                  >
                    <div>
                      <strong>{emp.firstName} {emp.lastName}</strong>
                      <span className="row-sub">{emp.email}</span>
                    </div>
                    <div className="row-meta">
                      <div className="row-badges">
                        <span className={`status-badge status-${emp.status}`}>{emp.status}</span>
                        {employmentStatusOf(emp) && (
                          <span className={`status-badge employment-${employmentStatusOf(emp)}`}>
                            {EMPLOYMENT_STATUS_LABELS[employmentStatusOf(emp)]}
                          </span>
                        )}
                      </div>
                      <span className="row-date">{formatDate(emp.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="dashboard-sidebar">
          {selected ? (
            <div className="card">
              <EmployeeReviewPanel
                employee={selected}
                hrEmail={user.email}
                onUpdated={loadEmployees}
                onDeleted={() => setSelectedId(null)}
              />
            </div>
          ) : (
            <div className="card empty-review">
              <p>Select an employee to review their details and documents.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
