import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import { Field } from '../../components/ui/Field';
import { useErrorMessage } from '../../components/ui/ErrorState';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const toMessage = useErrorMessage();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError(t('errors.passwordTooShort'));
    setBusy(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!token) return <div className="alert alert-danger">{t('errors.generic')}</div>;
  if (done) {
    return (
      <div>
        <div className="alert alert-success">{t('auth.resetDone')}</div>
        <Link to="/login" className="btn btn-nf-primary">
          {t('auth.signIn')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="h4 fw-bold mb-4">{t('auth.resetTitle')}</h1>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <Field
        label={t('auth.newPassword')}
        name="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <button type="submit" className="btn btn-nf-primary w-100" disabled={busy}>
        {busy ? t('common.loading') : t('common.save')}
      </button>
    </form>
  );
}
