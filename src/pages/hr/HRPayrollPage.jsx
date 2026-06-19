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
import {
  buildYearOptions,
  computePaidDaysFromPeriod,
  computePayrollPeriod,
} from '../../utils/payrollPeriod';
import SalaryForm from '../../components/SalaryForm';
import PageHeader from '../../components/PageHeader';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
  const [paidDays, setPaidDays] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [lopDays, setLopDays] = useState(0);
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [periodNote, setPeriodNote] = useState('');

  const years = buildYearOptions(now);

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

  function applyAutoPeriod(employee) {
    const period = computePayrollPeriod({
      month,
      year,
      startDate: employee?.startDate,
    });
    setTotalDays(period.totalDays);
    setPaidDays(period.paidDays);
    setLopDays(period.lopDays);
    setPayPeriodStart(period.payPeriodStart);
    setPayPeriodEnd(period.payPeriodEnd);
    setPeriodNote(period.note);
  }

  useEffect(() => {
    applyAutoPeriod(selected);
  }, [month, year, selectedId, selected?.startDate]);

  useEffect(() => {
    if (!selectedId) {
      setPayslips([]);
      return;
    }
    getEmployeePayslips(selectedId)
      .then(setPayslips)
      .catch(() => setPayslips([]));
  }, [selectedId]);

  function handleMonthChange(value) {
    setMonth(Number(value));
    setError('');
    setSuccess('');
  }

  function handleYearChange(value) {
    setYear(Number(value));
    setError('');
    setSuccess('');
  }

  function handlePaidDaysChange(value) {
    const paid = Math.max(0, Number(value) || 0);
    const capped = Math.min(paid, totalDays);
    setPaidDays(capped);
    setLopDays(Math.max(0, totalDays - capped));
    setPeriodNote('Paid days updated manually — adjust pay period if needed.');
  }

  function handleLopDaysChange(value) {
    const lop = Math.max(0, Number(value) || 0);
    const capped = Math.min(lop, totalDays);
    setLopDays(capped);
    setPaidDays(Math.max(0, totalDays - capped));
    setPeriodNote('LOP days updated manually.');
  }

  function handlePeriodStartChange(value) {
    setPayPeriodStart(value);
    const result = computePaidDaysFromPeriod(value, payPeriodEnd, totalDays, month, year);
    if (result) {
      setPaidDays(result.paidDays);
      setLopDays(result.lopDays);
      setPeriodNote('Pay period updated — paid days recalculated from dates.');
    }
  }

  function handlePeriodEndChange(value) {
    setPayPeriodEnd(value);
    const result = computePaidDaysFromPeriod(payPeriodStart, value, totalDays, month, year);
    if (result) {
      setPaidDays(result.paidDays);
      setLopDays(result.lopDays);
      setPeriodNote('Pay period updated — paid days recalculated from dates.');
    }
  }

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
    if (!paidDays || paidDays <= 0) {
      setError('Paid days must be greater than 0 for this payroll month.');
      return;
    }
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

  return (
    <div className="portal-page">
      <PageHeader
        title="Payroll"
        subtitle="Select month — days and pay period auto-calculate from DOJ and calendar"
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
                    <label htmlFor="payMonth">Payroll month *</label>
                    <select
                      id="payMonth"
                      value={month}
                      onChange={(e) => handleMonthChange(e.target.value)}
                    >
                      {MONTHS.map((name, i) => (
                        <option key={name} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="payYear">Year *</label>
                    <select
                      id="payYear"
                      value={year}
                      onChange={(e) => handleYearChange(e.target.value)}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {periodNote && (
                  <p className="field-hint">{periodNote}</p>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="paidDays">Paid days *</label>
                    <input
                      id="paidDays"
                      type="number"
                      min="0"
                      max={totalDays}
                      value={paidDays}
                      onChange={(e) => handlePaidDaysChange(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalDays">Total days in month</label>
                    <input
                      id="totalDays"
                      type="number"
                      min="1"
                      value={totalDays}
                      readOnly
                      className="input-readonly"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="lopDays">LOP days</label>
                  <input
                    id="lopDays"
                    type="number"
                    min="0"
                    max={totalDays}
                    value={lopDays}
                    onChange={(e) => handleLopDaysChange(e.target.value)}
                  />
                  <span className="field-hint">LOP + Paid days = {totalDays} (calendar days in month)</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="periodStart">Pay period start</label>
                    <input
                      id="periodStart"
                      value={payPeriodStart}
                      onChange={(e) => handlePeriodStartChange(e.target.value)}
                      placeholder="01-Jun-2026"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="periodEnd">Pay period end</label>
                    <input
                      id="periodEnd"
                      value={payPeriodEnd}
                      onChange={(e) => handlePeriodEndChange(e.target.value)}
                      placeholder="30-Jun-2026"
                    />
                  </div>
                </div>

                {selected.startDate && (
                  <p className="field-hint">
                    Employee DOJ: {selected.startDate}. Mid-month join auto-starts pay period from joining date.
                  </p>
                )}

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating || paidDays <= 0}>
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
