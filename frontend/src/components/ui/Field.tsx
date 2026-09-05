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
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...input}
      />
      {hint && !error && (
        <div id={`${fieldId}-hint`} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={`${fieldId}-error`} className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
}
