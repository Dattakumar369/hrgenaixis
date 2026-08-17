import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllEmployees,
  deleteEmployee,
  STATUS,
  EMPLOYMENT_STATUS,
} from '../../services/employeeService';
import { employmentStatusOf } from '../../utils/employeeHelpers';
import PageHeader from '../../components/PageHeader';
import { APP_FULL_NAME } from '../../constants/brand';
import { toUserMessage, USER_MESSAGES } from '../../utils/userMessages';

export default function HRDashboardHome() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEmployees(await getAllEmployees());
    } catch (err) {
      setError(toUserMessage(err, USER_MESSAGES.loadEmployeesFailed));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = employees.filter((e) => employmentStatusOf(e) === EMPLOYMENT_STATUS.ACTIVE).length;
  const pending = employees.filter((e) => e.status === STATUS.SUBMITTED).length;
  const invited = employees.filter((e) => e.status === STATUS.INVITED).length;
  const resigned = employees.filter((e) => employmentStatusOf(e) === EMPLOYMENT_STATUS.RESIGNED).length;

  const recent = [...employees]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 8);

  async function handleDelete(emp) {
    const ok = window.confirm(
      `Delete ${emp.firstName} ${emp.lastName}? This permanently removes their record, documents, and payslips.`
    );
    if (!ok) return;

    setDeletingId(emp.id);
    setError('');
    try {
      await deleteEmployee(emp.id);
      await load();
    } catch (err) {
      setError(toUserMessage(err, USER_MESSAGES.deleteFailed));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="portal-page">
      <PageHeader
        title="Dashboard"
        subtitle={`${APP_FULL_NAME} · Welcome back, ${user.email}`}
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-stats portal-stats">
        {[
          { label: 'Active employees', value: active, key: 'approved' },
          { label: 'Pending onboarding', value: pending, key: 'submitted' },
          { label: 'Invited (not started)', value: invited, key: 'invited' },
          { label: 'Resigned', value: resigned, key: 'total' },
        ].map((stat) => (
          <div key={stat.key} className={`stat-card stat-card--${stat.key}`}>
            <span className="stat-value">{loading ? '—' : stat.value}</span>
            <span className="stat-name">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="portal-grid-2">
        <div className="card">
          <h2 className="card-title">Quick actions</h2>
          <div className="quick-actions">
            <Link to="/hr/onboarding" className="quick-action-card">
              <strong>Invite employee</strong>
              <span>Create login and start onboarding</span>
            </Link>
            <Link to="/hr/onboarding" className="quick-action-card">
              <strong>Review submissions</strong>
              <span>{pending} waiting for HR review</span>
            </Link>
            <Link to="/hr/payroll" className="quick-action-card">
              <strong>Generate payslips</strong>
              <span>Payroll for active employees</span>
            </Link>
            <Link to="/hr/holidays" className="quick-action-card">
              <strong>Holiday calendar</strong>
              <span>Plan and publish company holidays</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="list-header">
            <h2 className="card-title">Recent employees</h2>
            <Link to="/hr/employees" className="btn btn-secondary btn-sm">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="empty-state">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="empty-state">No employees yet.</p>
          ) : (
            <div className="data-table compact">
              <div className="data-table-head data-table-head--compact">
                <span>Employee</span>
                <span>Actions</span>
              </div>
              {recent.map((emp) => (
                <div key={emp.id} className="data-row data-row--actions">
                  <div>
                    <strong>{emp.firstName} {emp.lastName}</strong>
                    <span className="row-sub">{emp.email || emp.department || '—'}</span>
                  </div>
                  <div className="data-row-actions">
                    <span className={`status-badge status-${emp.status}`}>{emp.status}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(emp)}
                      disabled={deletingId === emp.id}
                    >
                      {deletingId === emp.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
