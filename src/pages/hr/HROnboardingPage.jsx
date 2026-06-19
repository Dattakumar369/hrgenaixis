import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllEmployees,
  STATUS,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_STATUS_LABELS,
} from '../../services/employeeService';
import CreateEmployeeForm from '../../components/CreateEmployeeForm';
import EmployeeReviewPanel from '../../components/EmployeeReviewPanel';
import { employmentStatusOf, formatDate } from '../../utils/employeeHelpers';
import PageHeader from '../../components/PageHeader';

export default function HROnboardingPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees(await getAllEmployees());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter((emp) => {
    if (filter === 'all') return true;
    if (Object.values(EMPLOYMENT_STATUS).includes(filter)) {
      return employmentStatusOf(emp) === filter;
    }
    return emp.status === filter;
  });

  const selected = employees.find((e) => e.id === selectedId);
  const pendingCount = employees.filter((e) => e.status === STATUS.SUBMITTED).length;

  return (
    <div className="portal-page">
      <PageHeader
        title="Onboarding"
        subtitle="Invite new hires and review submitted documents"
      />

      <div className="portal-split">
        <div className="portal-split-main">
          <CreateEmployeeForm hrEmail={user.email} onCreated={load} />

          <div className="card">
            <div className="list-header">
              <h2 className="card-title">Onboarding queue</h2>
              {pendingCount > 0 && (
                <span className="pending-badge">{pendingCount} pending review</span>
              )}
            </div>

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

            {loading ? (
              <p className="empty-state">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="empty-state">No employees in this queue.</p>
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
                      <span className={`status-badge status-${emp.status}`}>{emp.status}</span>
                      <span className="row-date">{formatDate(emp.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="portal-split-side">
          {selected ? (
            <div className="card">
              <EmployeeReviewPanel
                employee={selected}
                hrEmail={user.email}
                onUpdated={load}
                onDeleted={() => setSelectedId(null)}
              />
            </div>
          ) : (
            <div className="card empty-review">
              <p>Select an employee to review onboarding details and documents.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
