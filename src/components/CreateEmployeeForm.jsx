import { useState } from 'react';
import { createEmployeeRecord } from '../services/employeeService';

const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Other',
];

const INITIAL = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
  jobTitle: '',
  startDate: '',
};

export default function CreateEmployeeForm({ hrEmail, onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Required';
    if (!form.lastName.trim()) next.lastName = 'Required';
    if (!form.email.trim()) next.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email';
    if (!form.password || form.password.length < 6) next.password = 'Min 6 characters';
    if (!form.department) next.department = 'Required';
    if (!form.jobTitle.trim()) next.jobTitle = 'Required';
    if (!form.startDate) next.startDate = 'Required';
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      await createEmployeeRecord(form, hrEmail);
      setCreatedCredentials({ email: form.email.trim().toLowerCase(), password: form.password });
      setForm(INITIAL);
      setErrors({});
      setStatus('success');
      onCreated?.();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to create employee account.');
    }
  }

  return (
    <div className="card create-employee-card">
      <h2>Invite Employee</h2>
      <p className="section-desc">
        Create login credentials for a new Genaixis team member. Share the email and password after inviting.
      </p>

      {status === 'success' && createdCredentials && (
        <div className="alert alert-success" role="status">
          <strong>Employee invited successfully.</strong>
          <p className="credentials-share">
            Share these login details with the employee:
            <br />
            Email: <strong>{createdCredentials.email}</strong>
            <br />
            Password: <strong>{createdCredentials.password}</strong>
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert-error" role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-employee-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First name *</label>
            <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} className={errors.firstName ? 'input-error' : ''} />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last name *</label>
            <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} className={errors.lastName ? 'input-error' : ''} />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Work email *</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Temporary password *</label>
            <input id="password" name="password" type="text" value={form.password} onChange={handleChange} className={errors.password ? 'input-error' : ''} placeholder="Min 6 characters" />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="department">Department *</label>
            <select id="department" name="department" value={form.department} onChange={handleChange} className={errors.department ? 'input-error' : ''}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && <span className="field-error">{errors.department}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="jobTitle">Job title *</label>
            <input id="jobTitle" name="jobTitle" value={form.jobTitle} onChange={handleChange} className={errors.jobTitle ? 'input-error' : ''} />
            {errors.jobTitle && <span className="field-error">{errors.jobTitle}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start date *</label>
          <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleChange} className={errors.startDate ? 'input-error' : ''} />
          {errors.startDate && <span className="field-error">{errors.startDate}</span>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Inviting…' : 'Invite employee'}
        </button>
      </form>
    </div>
  );
}
