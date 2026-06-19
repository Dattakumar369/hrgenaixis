import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllEmployees,
  STATUS,
  EMPLOYMENT_STATUS,
} from '../../services/employeeService';
import {
  updateSalaryStructure,
  generatePayslip,
  getEmployeePayslips,
} from '../../services/payslipService';
import { downloadPayslipPdf } from '../../services/payslipPdf';
import { employmentStatusOf, formatMonthYear } from '../../utils/employeeHelpers';
import SalaryForm from '../../components/SalaryForm';
import PageHeader from '../../components/PageHeader';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function defaultPayPeriod(month, year) {
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${String(lastDay).padStart(2, '0')}-${MONTHS[month - 1].slice(0, 3)}-${year}`;
  const start = `01-${MONTHS[month - 1].slice(0, 3)}-${year}`;
  return { start, end, totalDays: lastDay };
}

export default function HRPayrollPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [paidDays, setPaidDays] = useState(now.getDate());
  const [totalDays, setTotalDays] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  const [lopDays, setLopDays] = useState(0);
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');

  useEffect(() => {
    const period = defaultPayPeriod(month, year);
    setTotalDays(period.totalDays);
    if (!payPeriodStart && !payPeriodEnd) {
      setPayPeriodStart(period.start);
      setPayPeriodEnd(period.end);
    }
  }, [month, year]);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllEmployees();
      setEmployees(all.filter((e) => employmentStatusOf(e) === EMPLOYMENT_STATUS.ACTIVE || e.status === STATUS.APPROVED));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const selected = employees.find((e) => e.id === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setPayslips([]);
      return;
    }
    getEmployeePayslips(selectedId)
      .then(setPayslips)
      .catch(() => setPayslips([]));
  }, [selectedId]);

  async function handleSaveSalary(salaryData) {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await updateSalaryStructure(selected.id, salaryData);
      await loadEmployees();
      setSuccess('Salary details updated.');
    } catch (err) {
      setError(err?.message || 'Failed to save salary.');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const fresh = employees.find((e) => e.id === selected.id) || selected;
      const payslip = await generatePayslip(
        fresh,
        {
          month,
          year,
          paidDays,
          totalDays,
          payPeriodStart,
          payPeriodEnd,
          lopDays,
        },
        user.email
      );
      setPayslips(await getEmployeePayslips(selected.id));
      await downloadPayslipPdf(payslip, fresh);
      setSuccess(`Payslip generated for ${formatMonthYear(month, year)}. Employee can download from My Payslips.`);
    } catch (err) {
      setError(err?.message || 'Failed to generate payslip.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(payslip) {
    await downloadPayslipPdf(payslip, selected);
  }

  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <div className="portal-page">
      <PageHeader
        title="Payroll"
        subtitle="Set gross salary and generate pro-rated payslips (same formula for all employees)"
      />

      <div className="portal-split">
        <div className="portal-split-main">
          <div className="card">
            <h2 className="card-title">Active employees</h2>
            {loading ? (
              <p className="empty-state">Loading…</p>
            ) : employees.length === 0 ? (
              <p className="empty-state">No active employees. Approve onboarding first.</p>
            ) : (
              <div className="employee-table">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    className={`employee-row ${selectedId === emp.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedId(emp.id); setSuccess(''); setError(''); }}
                  >
                    <div>
                      <strong>{emp.firstName} {emp.lastName}</strong>
                      <span className="row-sub">{emp.jobTitle || emp.department}</span>
                    </div>
                    <span className="row-sub">
                      {emp.salary?.grossMonthly
                        ? `₹ ${Number(emp.salary.grossMonthly).toLocaleString('en-IN')} / month`
                        : 'Gross salary not set'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="card">
              <h2 className="card-title">Salary details</h2>
              <SalaryForm key={selected.id} employee={selected} onSave={handleSaveSalary} saving={saving} />
            </div>
          )}
        </div>

        <aside className="portal-split-side">
          {selected ? (
            <>
              <div className="card">
                <h2 className="card-title">Generate payslip</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="payMonth">Month</label>
                    <select id="payMonth" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                      {MONTHS.map((name, i) => (
                        <option key={name} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="payYear">Year</label>
                    <select id="payYear" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paidDays">Paid days *</label>
                    <input id="paidDays" type="number" min="1" value={paidDays} onChange={(e) => setPaidDays(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalDays">Total days in month</label>
                    <input id="totalDays" type="number" min="1" value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lopDays">LOP days</label>
                  <input id="lopDays" type="number" min="0" value={lopDays} onChange={(e) => setLopDays(Number(e.target.value))} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="periodStart">Pay period start</label>
                    <input id="periodStart" value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)} placeholder="18-Jun-2026" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="periodEnd">Pay period end</label>
                    <input id="periodEnd" value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)} placeholder="30-Jun-2026" />
                  </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate & download PDF'}
                </button>
              </div>

              <div className="card">
                <h2 className="card-title">Payslip history</h2>
                {payslips.length === 0 ? (
                  <p className="empty-state">No payslips generated yet.</p>
                ) : (
                  <div className="payslip-list">
                    {payslips.map((p) => (
                      <div key={p.id} className="payslip-item">
                        <div>
                          <strong>{formatMonthYear(p.month, p.year)}</strong>
                          <span className="row-sub">
                            {p.paidDays}/{p.totalDays} days · Net ₹ {Number(p.netPay).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDownload(p)}>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card empty-review">
              <p>Select an employee to set gross salary and generate payslips.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
