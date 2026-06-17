import { useEffect, useState } from 'react';
import {
  approveEmployee,
  rejectEmployee,
  updateEmploymentStatus,
  updateEmployeeDetails,
  deleteEmployee,
  STATUS,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_STATUS_LABELS,
} from '../services/employeeService';
import { getDocumentUrl } from '../services/documentService';

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function DocumentLink({ label, doc, employeeId }) {
  const [url, setUrl] = useState(doc?.fileUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (url || !doc?.documentId || !employeeId) return;

    setLoading(true);
    getDocumentUrl(employeeId, doc.documentId)
      .then((dataUrl) => setUrl(dataUrl))
      .finally(() => setLoading(false));
  }, [doc, url, employeeId]);

  if (!doc?.fileName) return null;
  if (loading) return <span className="doc-link doc-loading">Loading {doc.fileName}…</span>;
  if (!url) return <span className="doc-link doc-missing">{doc.fileName} (unavailable)</span>;

  const linkText = label ? `${label}: ${doc.fileName}` : doc.fileName;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" download={doc.fileName} className="doc-link">
      {linkText}
    </a>
  );
}

function DocumentList({ label, docs, employeeId }) {
  if (!docs?.length) return null;
  return (
    <div className="doc-group">
      <span className="detail-label">{label}</span>
      <div className="doc-links">
        {docs.map((doc, index) => (
          <DocumentLink key={doc.documentId || index} doc={doc} employeeId={employeeId} />
        ))}
      </div>
    </div>
  );
}

const EDITABLE_FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'phone', label: 'Phone' },
  { key: 'department', label: 'Department' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'startDate', label: 'Start date', type: 'date' },
];

export default function EmployeeReviewPanel({ employee, hrEmail, onUpdated, onDeleted }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setEditing(false);
    setShowReject(false);
    setError('');
  }, [employee.id]);

  const docs = employee.documents || {};
  const canReview = employee.status === STATUS.SUBMITTED;
  const isOnboarded = employee.status === STATUS.APPROVED;
  const currentEmployment =
    employee.employmentStatus || (isOnboarded ? EMPLOYMENT_STATUS.ACTIVE : null);

  function startEdit() {
    setEditForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      phone: employee.phone || '',
      department: employee.department || '',
      jobTitle: employee.jobTitle || '',
      startDate: employee.startDate || '',
    });
    setEditing(true);
    setError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateEmployeeDetails(employee.id, editForm);
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Failed to update employee.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmploymentChange(status) {
    if (status === currentEmployment) return;
    setLoading(true);
    setError('');
    try {
      await updateEmploymentStatus(employee.id, status, hrEmail);
      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      `Delete ${employee.firstName} ${employee.lastName}? This permanently removes their record and cannot be undone.`
    );
    if (!ok) return;
    setLoading(true);
    setError('');
    try {
      await deleteEmployee(employee.id);
      onDeleted?.();
      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Failed to delete employee.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    setLoading(true);
    setError('');
    try {
      await approveEmployee(employee.id, hrEmail);
      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await rejectEmployee(employee.id, hrEmail, rejectReason);
      setShowReject(false);
      setRejectReason('');
      onUpdated?.();
    } catch (err) {
      setError(err?.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="review-panel">
      <div className="review-header">
        <h3>{employee.firstName} {employee.lastName}</h3>
        <div className="row-badges">
          <span className={`status-badge status-${employee.status}`}>{employee.status}</span>
          {currentEmployment && (
            <span className={`status-badge employment-${currentEmployment}`}>
              {EMPLOYMENT_STATUS_LABELS[currentEmployment]}
            </span>
          )}
        </div>
      </div>

      {isOnboarded && (
        <div className="review-section">
          <h4>Workforce Status</h4>
          <div className="employment-toggle">
            {Object.values(EMPLOYMENT_STATUS).map((status) => (
              <button
                key={status}
                type="button"
                className={`employment-pill employment-pill--${status} ${currentEmployment === status ? 'active' : ''}`}
                onClick={() => handleEmploymentChange(status)}
                disabled={loading}
              >
                {EMPLOYMENT_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      {editing ? (
        <form className="review-section edit-form" onSubmit={handleSaveEdit}>
          <h4>Edit Details</h4>
          {EDITABLE_FIELDS.map((field) => (
            <div className="form-group" key={field.key}>
              <label htmlFor={`edit-${field.key}`}>{field.label}</label>
              <input
                id={`edit-${field.key}`}
                type={field.type || 'text'}
                value={editForm[field.key] || ''}
                onChange={(e) => setEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="review-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="review-section">
          <h4>Basic Info</h4>
          <DetailRow label="Email" value={employee.email} />
          <DetailRow label="Phone" value={employee.phone} />
          <DetailRow label="Department" value={employee.department} />
          <DetailRow label="Job title" value={employee.jobTitle} />
          <DetailRow label="Start date" value={employee.startDate} />
        </div>
      )}

      {(employee.address || employee.city) && (
        <div className="review-section">
          <h4>Address</h4>
          <DetailRow label="Street" value={employee.address} />
          <DetailRow label="City" value={employee.city} />
          <DetailRow label="State" value={employee.state} />
          <DetailRow label="ZIP" value={employee.zipCode} />
        </div>
      )}

      {(employee.emergencyContactName || employee.emergencyContactPhone) && (
        <div className="review-section">
          <h4>Emergency Contact</h4>
          <DetailRow label="Name" value={employee.emergencyContactName} />
          <DetailRow label="Phone" value={employee.emergencyContactPhone} />
        </div>
      )}

      {docs.aadhar && (
        <div className="review-section">
          <h4>Identity Documents</h4>
          <DetailRow label="Aadhar" value={docs.aadhar.number} />
          <DocumentLink label="Aadhar file" doc={docs.aadhar} employeeId={employee.id} />
          <DetailRow label="PAN" value={docs.pan?.number} />
          <DocumentLink label="PAN file" doc={docs.pan} employeeId={employee.id} />
        </div>
      )}

      {docs.currentCompany && (
        <div className="review-section">
          <h4>Current Company Letters</h4>
          <DocumentLink label="Offer letter" doc={docs.currentCompany.offerLetter} employeeId={employee.id} />
          <DocumentLink label="Joining letter" doc={docs.currentCompany.joiningLetter} employeeId={employee.id} />
          <DocumentLink label="Appointment letter" doc={docs.currentCompany.appointmentLetter} employeeId={employee.id} />
        </div>
      )}

      {docs.previousCompanies?.length > 0 && (
        <div className="review-section">
          <h4>Previous Companies</h4>
          {docs.previousCompanies.map((company, index) => (
            <div key={index} className="review-company-block">
              <strong>{company.companyName || `Company ${index + 1}`}</strong>
              <DocumentLink label="Offer letter" doc={company.offerLetter} employeeId={employee.id} />
              <DocumentLink label="Relieving letter" doc={company.relievingLetter} employeeId={employee.id} />
              <DocumentList label="Pay slips" docs={company.paySlips} employeeId={employee.id} />
              <DocumentList label="Form 16" docs={company.form16} employeeId={employee.id} />
            </div>
          ))}
        </div>
      )}

      {docs.previousCompany?.length > 0 && (
        <div className="review-section">
          <h4>Previous Company (legacy)</h4>
          <DocumentList label="Documents" docs={docs.previousCompany} employeeId={employee.id} />
        </div>
      )}

      {docs.educational?.length > 0 && (
        <div className="review-section">
          <h4>Educational Documents</h4>
          <DocumentList label="Certificates" docs={docs.educational} employeeId={employee.id} />
        </div>
      )}

      {employee.rejectionReason && (
        <div className="alert alert-error">
          Rejection reason: {employee.rejectionReason}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {canReview && (
        <div className="review-actions">
          {!showReject ? (
            <>
              <button type="button" className="btn btn-success" onClick={handleApprove} disabled={loading}>
                Approve onboarding
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={() => setShowReject(true)} disabled={loading}>
                Reject
              </button>
            </>
          ) : (
            <form onSubmit={handleReject} className="reject-form">
              <div className="form-group">
                <label htmlFor="rejectReason">Rejection reason</label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Tell the employee what needs to be corrected"
                />
              </div>
              <div className="review-actions">
                <button type="submit" className="btn btn-outline-danger" disabled={loading}>
                  Confirm reject
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReject(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!editing && (
        <div className="review-manage">
          <button type="button" className="btn btn-secondary btn-sm" onClick={startEdit} disabled={loading}>
            Edit details
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDelete} disabled={loading}>
            Delete employee
          </button>
        </div>
      )}
    </div>
  );
}
