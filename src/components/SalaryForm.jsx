import { useEffect, useState } from 'react';
import { PAYROLL_DEFAULTS, computePayslipBreakdown } from '../utils/payrollCalculator';
import { resolveEmployeePayrollInfo } from '../utils/employeeHelpers';

function InfoRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  );
}

export default function SalaryForm({ employee, onSave, saving }) {
  const payrollInfo = resolveEmployeePayrollInfo(employee);
  const [grossMonthly, setGrossMonthly] = useState(payrollInfo.grossMonthly || '');
  const [message, setMessage] = useState('');
  const [previewDays, setPreviewDays] = useState({ paidDays: 30, totalDays: 30 });

  useEffect(() => {
    const info = resolveEmployeePayrollInfo(employee);
    setGrossMonthly(info.grossMonthly || '');
    setMessage('');
  }, [employee.id]);

  const preview = computePayslipBreakdown({
    grossMonthly,
    paidDays: previewDays.paidDays,
    totalDays: previewDays.totalDays,
    pfRate: PAYROLL_DEFAULTS.pfRate,
    professionalTax: PAYROLL_DEFAULTS.professionalTax,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const info = resolveEmployeePayrollInfo(employee);
    try {
      await onSave({
        ...info,
        grossMonthly: Number(grossMonthly) || 0,
        pfRate: PAYROLL_DEFAULTS.pfRate,
        professionalTax: PAYROLL_DEFAULTS.professionalTax,
      });
      setMessage('Salary details saved.');
    } catch (err) {
      setMessage(err?.message || 'Failed to save.');
    }
  }

  const pfPercent = PAYROLL_DEFAULTS.pfRate * 100;

  return (
    <form onSubmit={handleSubmit} className="salary-form">
      <div className="salary-employee-info card-inner">
        <h3 className="salary-section-title">Employee information</h3>
        <p className="section-desc">From onboarding — used automatically on payslips.</p>
        <InfoRow label="Name" value={`${employee.firstName} ${employee.lastName}`} />
        <InfoRow label="Employee ID" value={payrollInfo.employeeCode} />
        <InfoRow label="UAN" value={payrollInfo.uan} />
        <InfoRow label="Bank" value={payrollInfo.bankName} />
        <InfoRow label="Account number" value={payrollInfo.bankAccount} />
        <InfoRow label="Department" value={employee.department} />
        <InfoRow label="Job title" value={employee.jobTitle} />
      </div>

      <p className="section-desc">
        Total gross includes employer PF. Salary gross = total gross − employer PF.
        Basic = 50% of salary gross · HRA = 50% of basic · Special = remainder ·
        Employee PF = {pfPercent}% of MIN(basic, ₹15,000), pro-rated by paid days · Professional tax = ₹{PAYROLL_DEFAULTS.professionalTax}
      </p>

      <div className="form-group">
        <label htmlFor="grossMonthly">Monthly total gross (₹) *</label>
        <input
          id="grossMonthly"
          name="grossMonthly"
          type="number"
          min="0"
          step="1"
          value={grossMonthly}
          onChange={(e) => setGrossMonthly(e.target.value)}
          required
        />
      </div>

      <div className="salary-preview card-inner">
        <h3 className="salary-section-title">Formula preview</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="previewPaid">Paid days</label>
            <input
              id="previewPaid"
              type="number"
              min="1"
              value={previewDays.paidDays}
              onChange={(e) => setPreviewDays((p) => ({ ...p, paidDays: Number(e.target.value) }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="previewTotal">Total days</label>
            <input
              id="previewTotal"
              type="number"
              min="1"
              value={previewDays.totalDays}
              onChange={(e) => setPreviewDays((p) => ({ ...p, totalDays: Number(e.target.value) }))}
            />
          </div>
        </div>
        <p className="field-hint">
          Salary gross ₹{preview.grossMonthly.toLocaleString('en-IN')} ·
          Basic ₹{preview.earnings.basic.payable.toLocaleString('en-IN')} · HRA ₹{preview.earnings.hra.payable.toLocaleString('en-IN')} ·
          Special ₹{preview.earnings.specialAllowance.payable.toLocaleString('en-IN')} ·
          Employee PF ₹{preview.deductions.employeePF.payable.toLocaleString('en-IN')}
        </p>
        <div className="salary-summary">
          <div><span>Gross earnings</span><strong>₹ {preview.grossPayable.toLocaleString('en-IN')}</strong></div>
          <div><span>Total deductions</span><strong>₹ {preview.totalDeductionsPayable.toLocaleString('en-IN')}</strong></div>
          <div className="salary-net"><span>Net salary</span><strong>₹ {preview.netPayable.toLocaleString('en-IN')}</strong></div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('saved') ? 'alert-success' : 'alert-error'}`}>{message}</div>
      )}

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save gross salary'}
      </button>
    </form>
  );
}
