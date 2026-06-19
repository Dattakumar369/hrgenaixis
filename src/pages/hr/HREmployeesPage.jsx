import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllEmployees,
  STATUS,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_STATUS_LABELS,
} from '../../services/employeeService';
import { exportEmployeesToExcel } from '../../services/exportService';
import { employmentStatusOf, formatDate } from '../../utils/employeeHelpers';
import EmployeeReviewPanel from '../../components/EmployeeReviewPanel';
import PageHeader from '../../components/PageHeader';

export default function HREmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEmployees(await getAllEmployees());
    } catch (err) {
      setError(err?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const employmentValues = Object.values(EMPLOYMENT_STATUS);
  const q = search.trim().toLowerCase();

  const filtered = employees.filter((emp) => {
    const matchFilter =
      filter === 'all' ||
      (employmentValues.includes(filter) ? employmentStatusOf(emp) === filter : emp.status === filter);
    const matchSearch =
      !q ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const selected = employees.find((e) => e.id === selectedId);

  return (
    <div className="portal-page">
      <PageHeader
        title="Employees"
        subtitle="Directory of all team members"
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportEmployeesToExcel(filtered, filter)}
            disabled={filtered.length === 0}
          >
            Export Excel
          </button>
        }
      />

      <div className="portal-split">
        <div className="portal-split-main">
          <div className="card">
            <div className="toolbar">
              <input
                type="search"
                placeholder="Search by name, email, department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Workforce</span>
              <div className="filter-tabs">
                {['all', ...Object.values(EMPLOYMENT_STATUS)].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`filter-tab ${filter === item ? 'active' : ''}`}
                    onClick={() => setFilter(item)}
                  >
                    {item === 'all' ? 'All' : EMPLOYMENT_STATUS_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
              <p className="empty-state">Loading employees…</p>
            ) : filtered.length === 0 ? (
              <p className="empty-state">No employees match your filters.</p>
            ) : (
              <div className="data-table">
                <div className="data-table-head">
                  <span>Employee</span>
                  <span>Department</span>
                  <span>Status</span>
                  <span>Joined</span>
                </div>
                {filtered.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    className={`data-table-row ${selectedId === emp.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(emp.id)}
                  >
                    <div>
                      <strong>{emp.firstName} {emp.lastName}</strong>
                      <span className="row-sub">{emp.email}</span>
                    </div>
                    <span>{emp.department || '—'}</span>
                    <div className="row-badges">
                      <span className={`status-badge status-${emp.status}`}>{emp.status}</span>
                      {employmentStatusOf(emp) && (
                        <span className={`status-badge employment-${employmentStatusOf(emp)}`}>
                          {EMPLOYMENT_STATUS_LABELS[employmentStatusOf(emp)]}
                        </span>
                      )}
                    </div>
                    <span className="row-date">{formatDate(emp.createdAt)}</span>
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
              <p>Select an employee to view profile and manage status.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
