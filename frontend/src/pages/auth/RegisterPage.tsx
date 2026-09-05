import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Field } from '../../components/ui/Field';
import { useErrorMessage } from '../../components/ui/ErrorState';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="h4 fw-bold mb-1">{t('auth.registerTitle')}</h1>
      <p className="text-muted mb-4">{t('auth.registerSubtitle')}</p>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <Field label={t('auth.name')} name="name" required value={form.name} onChange={set('name')} autoComplete="name" />
      <Field label={t('auth.email')} name="email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
      <Field
        label={t('auth.password')}
        name="password"
        type="password"
        required
        value={form.password}
        onChange={set('password')}
        autoComplete="new-password"
        hint={t('errors.passwordTooShort')}
      />

      <button type="submit" className="btn btn-nf-primary w-100" disabled={busy}>
        {busy ? t('common.loading') : t('auth.signUp')}
      </button>

      <p className="text-center text-muted mt-4 mb-0 small">
        {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
      </p>
    </form>
  );
}
