import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllEmployees, STATUS, EMPLOYMENT_STATUS } from '../../services/employeeService';
import { employmentStatusOf } from '../../utils/employeeHelpers';
import PageHeader from '../../components/PageHeader';
import { APP_FULL_NAME } from '../../constants/brand';

export default function HRDashboardHome() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees(await getAllEmployees());
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
    .slice(0, 5);

  return (
    <div className="portal-page">
      <PageHeader
        title="Dashboard"
        subtitle={`${APP_FULL_NAME} · Welcome back, ${user.email}`}
      />

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
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Recent hires</h2>
          {loading ? (
            <p className="empty-state">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="empty-state">No employees yet.</p>
          ) : (
            <div className="data-table compact">
              {recent.map((emp) => (
                <div key={emp.id} className="data-row">
                  <div>
                    <strong>{emp.firstName} {emp.lastName}</strong>
                    <span className="row-sub">{emp.department || '—'}</span>
                  </div>
                  <span className={`status-badge status-${emp.status}`}>{emp.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
