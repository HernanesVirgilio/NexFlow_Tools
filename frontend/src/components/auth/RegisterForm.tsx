import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useErrorMessage } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { PasswordField } from './PasswordField';
import { SocialAuthButtons } from './SocialAuthButtons';

type FieldKey = 'name' | 'email' | 'password' | 'confirm';

/** Account creation form. Uses the existing AuthContext.register flow. */
export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, []);

  const set = (k: FieldKey) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const next: Partial<Record<FieldKey, string>> = {};
    if (form.name.trim().length < 2) next.name = t('errors.nameTooShort');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t('errors.invalidEmail');
    if (form.password.length < 8) next.password = t('errors.passwordTooShort');
    if (form.confirm !== form.password) next.confirm = t('errors.passwordMismatch');
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="nf-slide__form" onSubmit={onSubmit} noValidate>
      <h1 className="h4 nf-slide__title">{t('auth.registerTitle')}</h1>
      <p className="nf-slide__subtitle">{t('auth.registerSubtitle')}</p>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <Field
        label={t('auth.name')}
        name="name"
        autoComplete="name"
        placeholder={t('auth.namePlaceholder')}
        value={form.name}
        error={fieldErrors.name}
        onChange={set('name')}
      />
      <Field
        label={t('auth.email')}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t('auth.emailPlaceholder')}
        value={form.email}
        error={fieldErrors.email}
        onChange={set('email')}
      />
      <PasswordField
        label={t('auth.password')}
        name="password"
        autoComplete="new-password"
        placeholder={t('auth.passwordPlaceholder')}
        value={form.password}
        error={fieldErrors.password}
        hint={t('errors.passwordTooShort')}
        onChange={set('password')}
      />
      <PasswordField
        label={t('auth.confirmPassword')}
        name="confirm"
        autoComplete="new-password"
        placeholder={t('auth.confirmPasswordPlaceholder')}
        value={form.confirm}
        error={fieldErrors.confirm}
        onChange={set('confirm')}
      />

      <button type="submit" className="btn btn-nf-primary w-100" disabled={busy}>
        {busy ? t('common.loading') : t('auth.createAccount')}
      </button>

      <SocialAuthButtons />

      <p className="text-center nf-slide__subtitle mt-4 mb-0 small">
        {t('auth.haveAccount')}{' '}
        <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={onSwitch}>
          {t('auth.signIn')}
        </button>
      </p>
    </form>
  );
}
