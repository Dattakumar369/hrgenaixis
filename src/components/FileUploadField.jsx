import { validateFile } from '../services/documentService';

export default function FileUploadField({
  id,
  label,
  hint,
  multiple = false,
  required = false,
  value,
  onChange,
  error,
}) {
  function handleChange(e) {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0] || null;

    if (multiple && files.length > 0) {
      const invalid = files.find((file) => validateFile(file));
      if (invalid) {
        onChange(null, validateFile(invalid));
        e.target.value = '';
        return;
      }
    } else if (!multiple && files) {
      const fileError = validateFile(files);
      if (fileError) {
        onChange(null, fileError);
        e.target.value = '';
        return;
      }
    }

    onChange(files, null);
  }

  const fileNames = multiple
    ? value?.map((f) => f.name).join(', ')
    : value?.name;

  const hasFile = multiple ? value?.length > 0 : !!value;

  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      <div className={`file-upload ${hasFile ? 'file-upload--filled' : ''} ${error ? 'file-upload-error' : ''}`}>
        <input
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple={multiple}
          onChange={handleChange}
          className="file-input"
        />
        <label htmlFor={id} className="file-label">
          <span className="file-icon-wrap">
            {hasFile ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            )}
          </span>
          <span className="file-text">
            <strong>{hasFile ? (multiple ? `${value.length} file(s) selected` : value.name) : 'Click to upload'}</strong>
            <span>{hasFile ? 'Click to change' : 'PDF, JPG, PNG · max 700 KB'}</span>
          </span>
        </label>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
