import { FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Field } from '../../components/ui/Field';
import { useErrorMessage } from '../../components/ui/ErrorState';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toMessage = useErrorMessage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="h4 fw-bold mb-1">{t('auth.loginTitle')}</h1>
      <p className="text-muted mb-4">{t('auth.loginSubtitle')}</p>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <Field
        label={t('auth.email')}
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label={t('auth.password')}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link to="/forgot-password" className="small">
          {t('auth.forgotPassword')}
        </Link>
      </div>

      <button type="submit" className="btn btn-nf-primary w-100" disabled={busy}>
        {busy ? t('common.loading') : t('auth.signIn')}
      </button>

      <p className="text-center text-muted mt-4 mb-0 small">
        {t('auth.noAccount')} <Link to="/register">{t('auth.signUp')}</Link>
      </p>
    </form>
  );
}
