import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import { Field } from '../../components/ui/Field';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authService.forgotPassword(email);
    } finally {
      setBusy(false);
      setDone(true);
    }
  }

  if (done) {
    return (
      <div>
        <div className="alert alert-success">{t('auth.checkEmail')}</div>
        <Link to="/login">{t('auth.signIn')}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="h4 fw-bold mb-1">{t('auth.forgotTitle')}</h1>
      <p className="text-muted mb-4">{t('auth.forgotSubtitle')}</p>
      <Field
        label={t('auth.email')}
        name="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <button type="submit" className="btn btn-nf-primary w-100" disabled={busy}>
        {busy ? t('common.loading') : t('auth.sendResetLink')}
      </button>
      <p className="text-center mt-4 mb-0 small">
        <Link to="/login">{t('common.back')}</Link>
      </p>
    </form>
  );
}
