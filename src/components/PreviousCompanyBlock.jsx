import FileUploadField from './FileUploadField';

const EMPTY_COMPANY = {
  companyName: '',
  offerLetter: null,
  relievingLetter: null,
  paySlips: null,
  form16: null,
};

export function createEmptyPreviousCompany() {
  return { id: crypto.randomUUID(), ...EMPTY_COMPANY };
}

export default function PreviousCompanyBlock({
  index,
  company,
  errors = {},
  onChange,
  onRemove,
  canRemove,
}) {
  function updateField(field, value, error) {
    onChange(index, { ...company, [field]: value }, field, error);
  }

  return (
    <div className="company-block">
      <div className="company-block-header">
        <h3>Previous company {index + 1}</h3>
        {canRemove && (
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onRemove(index)}>
            Remove
          </button>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`companyName-${company.id}`}>Company name *</label>
        <input
          id={`companyName-${company.id}`}
          type="text"
          value={company.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
          className={errors.companyName ? 'input-error' : ''}
          placeholder="Previous employer name"
        />
        {errors.companyName && <span className="field-error">{errors.companyName}</span>}
      </div>

      <div className="form-row">
        <FileUploadField
          id={`prevOffer-${company.id}`}
          label="Offer letter"
          required
          value={company.offerLetter}
          onChange={(file, err) => updateField('offerLetter', file, err)}
          error={errors.offerLetter}
        />
        <FileUploadField
          id={`prevRelieving-${company.id}`}
          label="Relieving letter"
          required
          value={company.relievingLetter}
          onChange={(file, err) => updateField('relievingLetter', file, err)}
          error={errors.relievingLetter}
        />
      </div>

      <FileUploadField
        id={`prevPayslips-${company.id}`}
        label="Pay slips"
        hint="Upload last 3 months or available payslips"
        multiple
        required
        value={company.paySlips}
        onChange={(files, err) => updateField('paySlips', files, err)}
        error={errors.paySlips}
      />

      <FileUploadField
        id={`prevForm16-${company.id}`}
        label="Form 16"
        hint="Upload Form 16 for each financial year if available"
        multiple
        required
        value={company.form16}
        onChange={(files, err) => updateField('form16', files, err)}
        error={errors.form16}
      />
    </div>
  );
}
