import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

/** Labelled text input with Bootstrap markup + error slot. Reused across all forms. */
export function Field({ label, error, hint, id, ...input }: FieldProps) {
  const fieldId = id ?? input.name ?? label;
  return (
    <div className="mb-3">
      <label htmlFor={fieldId} className="form-label">
        {label}
      </label>
      <input
        id={fieldId}
        className={`form-control${error ? ' is-invalid' : ''}`}
        {...input}
      />
      {hint && !error && <div className="form-text">{hint}</div>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
