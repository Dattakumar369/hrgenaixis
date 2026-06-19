import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ensureEmployeeLinked, STATUS } from '../../services/employeeService';
import { getEmployeePayslips } from '../../services/payslipService';
import { downloadPayslipPdf } from '../../services/payslipPdf';
import { formatMonthYear } from '../../utils/employeeHelpers';
import PageHeader from '../../components/PageHeader';

export default function EmployeePayslipsPage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const record = await ensureEmployeeLinked(user);
        setEmployee(record);
        if (!record) {
          setError('No employee record found.');
          return;
        }
        if (record.status !== STATUS.APPROVED) {
          setError('Payslips are available after HR approves your onboarding.');
          return;
        }
        setPayslips(await getEmployeePayslips(record.id));
      } catch (err) {
        setError(err?.message || 'Failed to load payslips.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.uid]);

  async function handleDownload(payslip) {
    setDownloadingId(payslip.id);
    try {
      await downloadPayslipPdf(payslip, employee);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="portal-page">
      <PageHeader title="My Payslips" subtitle="Download your monthly salary slips as PDF" />

      {loading && (
        <div className="loading-screen compact">
          <div className="spinner" />
          <p>Loading payslips…</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {!loading && !error && payslips.length === 0 && (
        <div className="card empty-review">
          <p>No payslips yet. HR will generate them each month after payroll is processed.</p>
        </div>
      )}

      {!loading && !error && payslips.length > 0 && (
        <div className="card">
          <div className="payslip-list">
            {payslips.map((p) => (
              <div key={p.id} className="payslip-item">
                <div>
                  <strong>{formatMonthYear(p.month, p.year)}</strong>
                  <span className="row-sub">
                    Pay period: {p.payPeriodStart || '—'} to {p.payPeriodEnd || '—'}
                  </span>
                  <span className="row-sub">
                    Paid {p.paidDays}/{p.totalDays} days · Net ₹ {Number(p.netPay).toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownload(p)}
                  disabled={downloadingId === p.id}
                >
                  {downloadingId === p.id ? 'Preparing…' : 'Download PDF'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
