import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ensureEmployeeLinked, STATUS } from '../../services/employeeService';
import OnboardingForm from '../../components/OnboardingForm';
import PageHeader from '../../components/PageHeader';

export default function EmployeeOnboardingPage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadEmployee() {
    setLoading(true);
    setError('');
    try {
      const record = await ensureEmployeeLinked(user);
      setEmployee(record);
      if (!record) {
        setError('No onboarding record found for your account. Contact HR.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load your onboarding record.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployee();
  }, [user.uid]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your onboarding…</p>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <PageHeader title="Onboarding" subtitle="Complete your profile and upload documents for HR review" />

      {error && (
        <div className="card">
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {!error && employee?.status === STATUS.APPROVED && (
        <div className="card success-card">
          <div className="success-icon">✓</div>
          <h2>Onboarding complete</h2>
          <p>HR has approved your onboarding. Welcome to Genaixis! View payslips from the sidebar.</p>
        </div>
      )}

      {!error && employee?.status === STATUS.SUBMITTED && (
        <div className="card status-card">
          <h2>Submitted for review</h2>
          <p>Your details and documents have been sent to HR. You will be notified once approved.</p>
        </div>
      )}

      {!error && (employee?.status === STATUS.INVITED || employee?.status === STATUS.REJECTED) && (
        <>
          {employee.status === STATUS.REJECTED && (
            <div className="alert alert-error card" style={{ marginBottom: '1rem' }}>
              HR rejected your submission: {employee.rejectionReason}. Please update and resubmit.
            </div>
          )}
          <OnboardingForm employee={employee} onSubmitted={loadEmployee} />
        </>
      )}
    </div>
  );
}
