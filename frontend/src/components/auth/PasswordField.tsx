import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

/**
 * Password input with an accessible show/hide toggle.
 * Same markup contract as `components/ui/Field` so forms stay consistent.
 */
export function PasswordField({ label, error, hint, id, ...input }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const fieldId = id ?? input.name ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="mb-3">
      <label htmlFor={fieldId} className="form-label">
        {label}
      </label>
      <div className="input-group">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={`form-control${error ? ' is-invalid' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          {...input}
        />
        <button
          type="button"
          className="btn btn-outline-secondary nf-password__toggle"
          aria-pressed={visible}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          onClick={() => setVisible((v) => !v)}
        >
          <EyeIcon off={visible} />
        </button>
      </div>
      {hint && !error && (
        <div id={`${fieldId}-hint`} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={`${fieldId}-error`} className="invalid-feedback d-block">
          {error}
        </div>
      )}
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="4" y1="4" x2="20" y2="20" />}
    </svg>
  );
}
