import { useState } from 'react';
import { auth } from '../firebase';
import { submitOnboarding } from '../services/employeeService';
import FileUploadField from './FileUploadField';
import StepIndicator from './StepIndicator';
import PreviousCompanyBlock, { createEmptyPreviousCompany } from './PreviousCompanyBlock';

const INITIAL_CURRENT_COMPANY = {
  offerLetter: null,
  joiningLetter: null,
  appointmentLetter: null,
};

function buildInitialForm(employee) {
  const salary = employee.salary || {};
  return {
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phone: employee.phone || '',
    department: employee.department || '',
    jobTitle: employee.jobTitle || '',
    startDate: employee.startDate || '',
    employeeCode: salary.employeeCode || employee.employeeCode || '',
    uan: salary.uan || employee.uan || '',
    bankName: salary.bankName || employee.bankName || '',
    bankAccount: salary.bankAccount || employee.bankAccount || '',
    address: employee.address || '',
    city: employee.city || '',
    state: employee.state || '',
    zipCode: employee.zipCode || '',
    emergencyContactName: employee.emergencyContactName || '',
    emergencyContactPhone: employee.emergencyContactPhone || '',
    aadharNumber: employee.documents?.aadhar?.number || '',
    panNumber: employee.documents?.pan?.number || '',
  };
}

function validate(form, documents, previousCompanies) {
  const errors = {};
  const docErrors = {};
  const companyErrors = {};

  if (!form.phone.trim()) errors.phone = 'Phone number is required';

  if (!form.employeeCode.trim()) {
    errors.employeeCode = 'Employee ID is required';
  }

  if (!form.uan.trim()) {
    errors.uan = 'UAN is required';
  } else if (!/^\d{12}$/.test(form.uan.replace(/\s/g, ''))) {
    errors.uan = 'Enter a valid 12-digit UAN';
  }

  if (!form.bankName.trim()) errors.bankName = 'Bank name is required';
  if (!form.bankAccount.trim()) errors.bankAccount = 'Account number is required';

  if (!form.aadharNumber.trim()) {
    errors.aadharNumber = 'Aadhar number is required';
  } else if (!/^\d{12}$/.test(form.aadharNumber.replace(/\s/g, ''))) {
    errors.aadharNumber = 'Enter a valid 12-digit Aadhar number';
  }

  if (!form.panNumber.trim()) {
    errors.panNumber = 'PAN number is required';
  } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.panNumber.trim())) {
    errors.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F)';
  }

  if (!documents.aadhar) docErrors.aadhar = 'Aadhar document is required';
  if (!documents.pan) docErrors.pan = 'PAN document is required';

  if (!documents.currentCompany.offerLetter) {
    docErrors.offerLetter = 'Offer letter is required';
  }
  if (!documents.currentCompany.joiningLetter) {
    docErrors.joiningLetter = 'Joining letter is required';
  }
  if (!documents.currentCompany.appointmentLetter) {
    docErrors.appointmentLetter = 'Appointment letter is required';
  }

  if (!documents.educational?.length) {
    docErrors.educational = 'Upload at least one educational document';
  }

  previousCompanies.forEach((company, index) => {
    const entry = {};
    if (!company.companyName.trim()) entry.companyName = 'Company name is required';
    if (!company.offerLetter) entry.offerLetter = 'Offer letter is required';
    if (!company.relievingLetter) entry.relievingLetter = 'Relieving letter is required';
    if (!company.paySlips?.length) entry.paySlips = 'Upload at least one pay slip';
    if (!company.form16?.length) entry.form16 = 'Upload Form 16';
    if (Object.keys(entry).length > 0) companyErrors[index] = entry;
  });

  if (previousCompanies.length === 0) {
    companyErrors[0] = { companyName: 'Add at least one previous company' };
  }

  return { errors, docErrors, companyErrors };
}

export default function OnboardingForm({ employee, onSubmitted }) {
  const [form, setForm] = useState(() => buildInitialForm(employee));
  const [documents, setDocuments] = useState({
    aadhar: null,
    pan: null,
    currentCompany: { ...INITIAL_CURRENT_COMPANY },
    educational: null,
  });
  const [previousCompanies, setPreviousCompanies] = useState([createEmptyPreviousCompany()]);
  const [errors, setErrors] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [companyErrors, setCompanyErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleDocumentChange(field, value, error) {
    if (field === 'currentCompany') {
      setDocuments((prev) => ({ ...prev, currentCompany: value }));
      if (error) setDocErrors((prev) => ({ ...prev, ...error }));
      else setDocErrors((prev) => {
        const next = { ...prev };
        Object.keys(value).forEach((k) => { if (value[k]) delete next[k]; });
        return next;
      });
      return;
    }

    setDocuments((prev) => ({ ...prev, [field]: value }));
    if (error) setDocErrors((prev) => ({ ...prev, [field]: error }));
    else if (docErrors[field]) setDocErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCurrentCompanyDoc(field, file, error) {
    const next = { ...documents.currentCompany, [field]: file };
    handleDocumentChange('currentCompany', next, error ? { [field]: error } : null);
  }

  function handlePreviousCompanyChange(index, updated, field, error) {
    setPreviousCompanies((prev) => prev.map((c, i) => (i === index ? updated : c)));
    setCompanyErrors((prev) => {
      const next = { ...prev };
      if (!next[index]) next[index] = {};
      if (error) next[index][field] = error;
      else delete next[index][field];
      if (Object.keys(next[index]).length === 0) delete next[index];
      return next;
    });
  }

  function addPreviousCompany() {
    setPreviousCompanies((prev) => [...prev, createEmptyPreviousCompany()]);
  }

  function removePreviousCompany(index) {
    setPreviousCompanies((prev) => prev.filter((_, i) => i !== index));
    setCompanyErrors((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        const i = Number(key);
        if (i < index) next[i] = val;
        if (i > index) next[i - 1] = val;
      });
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedForm = {
      ...form,
      aadharNumber: form.aadharNumber.replace(/\s/g, ''),
      panNumber: form.panNumber.trim().toUpperCase(),
      uan: form.uan.replace(/\s/g, ''),
      employeeCode: form.employeeCode.trim(),
      bankName: form.bankName.trim(),
      bankAccount: form.bankAccount.trim(),
      existingGrossMonthly: employee.salary?.grossMonthly || 0,
    };

    const { errors: validationErrors, docErrors: validationDocErrors, companyErrors: validationCompanyErrors } =
      validate(normalizedForm, documents, previousCompanies);

    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(validationDocErrors).length > 0 ||
      Object.keys(validationCompanyErrors).length > 0
    ) {
      setErrors(validationErrors);
      setDocErrors(validationDocErrors);
      setCompanyErrors(validationCompanyErrors);
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const uid = auth.currentUser?.uid || employee.uid;
      await submitOnboarding(employee.id, uid, normalizedForm, {
        ...documents,
        previousCompanies,
      });
      onSubmitted?.();
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to save employee data.');
    }
  }

  const identityDone = !!(form.aadharNumber && form.panNumber && documents.aadhar && documents.pan);
  const employmentDone = !!(
    documents.currentCompany.offerLetter &&
    documents.currentCompany.joiningLetter &&
    documents.currentCompany.appointmentLetter
  );
  const educationDone = documents.educational?.length > 0;
  const currentStep = educationDone ? 4 : employmentDone ? 3 : identityDone ? 2 : 1;

  return (
    <form className="card onboarding-form" onSubmit={handleSubmit} noValidate>
      <div className="form-header">
        <div className="form-header-badge">PeopleHub · Onboarding</div>
        <h1>Complete your profile</h1>
        <p>Submit your details and documents for HR review.</p>
      </div>

      <StepIndicator current={currentStep} />

      {status === 'error' && (
        <div className="alert alert-error" role="alert">{errorMessage}</div>
      )}

      <section className="form-section">
        <h2>Your Information (from HR)</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" type="text" value={form.firstName} readOnly className="input-readonly" />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" type="text" value={form.lastName} readOnly className="input-readonly" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" value={form.email} readOnly className="input-readonly" />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={errors.phone ? 'input-error' : ''} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Employment Details</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input id="department" name="department" type="text" value={form.department} readOnly className="input-readonly" />
          </div>
          <div className="form-group">
            <label htmlFor="jobTitle">Job title</label>
            <input id="jobTitle" name="jobTitle" type="text" value={form.jobTitle} readOnly className="input-readonly" />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="startDate">Start date</label>
          <input id="startDate" name="startDate" type="date" value={form.startDate} readOnly className="input-readonly" />
        </div>
      </section>

      <section className="form-section">
        <h2>Payroll &amp; Bank Details</h2>
        <p className="section-desc">Required for salary processing and payslip generation.</p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="employeeCode">Employee ID *</label>
            <input
              id="employeeCode"
              name="employeeCode"
              type="text"
              value={form.employeeCode}
              onChange={handleChange}
              placeholder="GXL0003"
              readOnly={!!(employee.salary?.employeeCode || employee.employeeCode)}
              className={`${errors.employeeCode ? 'input-error' : ''} ${(employee.salary?.employeeCode || employee.employeeCode) ? 'input-readonly' : ''}`}
            />
            {(employee.salary?.employeeCode || employee.employeeCode) && (
              <span className="field-hint">Assigned by HR</span>
            )}
            {errors.employeeCode && <span className="field-error">{errors.employeeCode}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="uan">UAN *</label>
            <input
              id="uan"
              name="uan"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={form.uan}
              onChange={handleChange}
              placeholder="12-digit UAN"
              className={errors.uan ? 'input-error' : ''}
            />
            {errors.uan && <span className="field-error">{errors.uan}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bankName">Bank name *</label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              value={form.bankName}
              onChange={handleChange}
              placeholder="HDFC Bank"
              className={errors.bankName ? 'input-error' : ''}
            />
            {errors.bankName && <span className="field-error">{errors.bankName}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="bankAccount">Account number *</label>
            <input
              id="bankAccount"
              name="bankAccount"
              type="text"
              inputMode="numeric"
              value={form.bankAccount}
              onChange={handleChange}
              className={errors.bankAccount ? 'input-error' : ''}
            />
            {errors.bankAccount && <span className="field-error">{errors.bankAccount}</span>}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Address</h2>
        <div className="form-group">
          <label htmlFor="address">Street address</label>
          <input id="address" name="address" type="text" value={form.address} onChange={handleChange} />
        </div>
        <div className="form-row form-row-3">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" value={form.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="state">State</label>
            <input id="state" name="state" type="text" value={form.state} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="zipCode">ZIP code</label>
            <input id="zipCode" name="zipCode" type="text" value={form.zipCode} onChange={handleChange} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Emergency Contact</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="emergencyContactName">Contact name</label>
            <input id="emergencyContactName" name="emergencyContactName" type="text" value={form.emergencyContactName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="emergencyContactPhone">Contact phone</label>
            <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={handleChange} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Identity Documents</h2>
        <p className="section-desc">PDF, JPG, or PNG — max 700 KB each.</p>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="aadharNumber">Aadhar number *</label>
            <input id="aadharNumber" name="aadharNumber" type="text" inputMode="numeric" maxLength={12} value={form.aadharNumber} onChange={handleChange} className={errors.aadharNumber ? 'input-error' : ''} />
            {errors.aadharNumber && <span className="field-error">{errors.aadharNumber}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="panNumber">PAN number *</label>
            <input id="panNumber" name="panNumber" type="text" maxLength={10} value={form.panNumber} onChange={handleChange} className={errors.panNumber ? 'input-error' : ''} />
            {errors.panNumber && <span className="field-error">{errors.panNumber}</span>}
          </div>
        </div>
        <div className="form-row">
          <FileUploadField id="aadharDoc" label="Aadhar card" required value={documents.aadhar} onChange={(file, err) => handleDocumentChange('aadhar', file, err)} error={docErrors.aadhar} />
          <FileUploadField id="panDoc" label="PAN card" required value={documents.pan} onChange={(file, err) => handleDocumentChange('pan', file, err)} error={docErrors.pan} />
        </div>
      </section>

      <section className="form-section">
        <h2>Current Company Letters</h2>
        <p className="section-desc">Upload your offer letter, joining letter, and appointment letter for this role.</p>
        <FileUploadField id="currentOffer" label="Offer letter" required value={documents.currentCompany.offerLetter} onChange={(f, e) => handleCurrentCompanyDoc('offerLetter', f, e)} error={docErrors.offerLetter} />
        <FileUploadField id="currentJoining" label="Joining letter" required value={documents.currentCompany.joiningLetter} onChange={(f, e) => handleCurrentCompanyDoc('joiningLetter', f, e)} error={docErrors.joiningLetter} />
        <FileUploadField id="currentAppointment" label="Appointment letter" required value={documents.currentCompany.appointmentLetter} onChange={(f, e) => handleCurrentCompanyDoc('appointmentLetter', f, e)} error={docErrors.appointmentLetter} />
      </section>

      <section className="form-section">
        <h2>Previous Company Documents</h2>
        <p className="section-desc">For each previous employer, upload offer letter, relieving letter, pay slips, and Form 16.</p>
        {previousCompanies.map((company, index) => (
          <PreviousCompanyBlock
            key={company.id}
            index={index}
            company={company}
            errors={companyErrors[index] || {}}
            onChange={handlePreviousCompanyChange}
            onRemove={removePreviousCompany}
            canRemove={previousCompanies.length > 1}
          />
        ))}
        <button type="button" className="btn btn-secondary add-company-btn" onClick={addPreviousCompany}>
          + Add another company
        </button>
      </section>

      <section className="form-section">
        <h2>Educational Documents</h2>
        <p className="section-desc">Degree certificates, mark sheets, or provisional certificates.</p>
        <FileUploadField id="educationalDocs" label="Educational documents" multiple required value={documents.educational} onChange={(files, err) => handleDocumentChange('educational', files, err)} error={docErrors.educational} />
      </section>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Uploading documents…' : 'Submit for HR review'}
        </button>
      </div>
    </form>
  );
}
