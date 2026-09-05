import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useErrorMessage } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { PasswordField } from './PasswordField';
import { SocialAuthButtons } from './SocialAuthButtons';

const REMEMBER_KEY = 'nf_remember_email';

function readRemembered(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Sign-in form. Talks to the existing AuthContext / auth API — no new client. */
export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toMessage = useErrorMessage();
  const firstFieldRef = useRef<HTMLFormElement>(null);

  const remembered = readRemembered();
  const [email, setEmail] = useState(remembered);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(remembered !== '');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    firstFieldRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, []);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  function validate() {
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = t('errors.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t('errors.invalidEmail');
    if (!password) next.password = t('errors.required');
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore storage failures */
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={firstFieldRef} className="nf-slide__form" onSubmit={onSubmit} noValidate>
      <h1 className="h4 nf-slide__title">{t('auth.loginTitle')}</h1>
      <p className="nf-slide__subtitle">{t('auth.loginSubtitle')}</p>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <Field
        label={t('auth.email')}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        error={fieldErrors.email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordField
        label={t('auth.password')}
        name="password"
        autoComplete="current-password"
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        error={fieldErrors.password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="form-check mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            id="login-remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="login-remember">
            {t('auth.rememberMe')}
          </label>
        </div>
        <button type="button" className="btn btn-link btn-sm p-0 small" onClick={() => navigate('/forgot-password')}>
          {t('auth.forgotPassword')}
        </button>
      </div>

      <button type="submit" className="btn btn-nf-primary w-100" disabled={busy}>
        {busy ? t('common.loading') : t('auth.signIn')}
      </button>

      <SocialAuthButtons />

      <p className="text-center nf-slide__subtitle mt-3 mb-0 small">
        {t('auth.noAccount')}{' '}
        <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={onSwitch}>
          {t('auth.signUp')}
        </button>
      </p>
    </form>
  );
}
