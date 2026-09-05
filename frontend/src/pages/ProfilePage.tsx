import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/user.service';
import { Field } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { useErrorMessage } from '../components/ui/ErrorState';
import type { Language } from '../i18n';
import i18n from '../i18n';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const { setPreference } = useTheme();
  const toMessage = useErrorMessage();

  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function guard(fn: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  function saveAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void guard(async () => {
      const updated = await userService.updateProfile({
        name: String(fd.get('name')),
        avatarUrl: String(fd.get('avatarUrl') || '') || null,
      });
      setUser(updated);
      setNotice({ type: 'success', text: t('profile.saved') });
    });
  }

  function savePreferences(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const language = String(fd.get('language')) as Language;
    const theme = String(fd.get('theme')) as 'light' | 'dark' | 'system';
    void guard(async () => {
      const updated = await userService.updateProfile({ language, theme });
      setUser(updated);
      void i18n.changeLanguage(language);
      setPreference(theme);
      setNotice({ type: 'success', text: t('profile.saved') });
    });
  }

  function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    void guard(async () => {
      await userService.changePassword(String(fd.get('current')), String(fd.get('next')));
      setNotice({ type: 'success', text: t('profile.passwordChanged') });
      form.reset();
    });
  }

  return (
    <div>
      <PageHeader title={t('profile.title')} />
      {notice && <div className={`alert alert-${notice.type} py-2`}>{notice.text}</div>}

      <div className="nf-card nf-card--pad mb-4">
        <h2 className="h6 mb-3">{t('profile.accountSection')}</h2>
        <form onSubmit={saveAccount}>
          <Field label={t('common.name')} name="name" defaultValue={user.name} required />
          <Field label={t('auth.email')} name="email" defaultValue={user.email} disabled />
          <Field label={t('profile.avatarUrl')} name="avatarUrl" type="url" defaultValue={user.avatarUrl ?? ''} />
          <button type="submit" className="btn btn-nf-primary" disabled={busy}>
            {t('common.save')}
          </button>
        </form>
      </div>

      <div className="nf-card nf-card--pad mb-4">
        <h2 className="h6 mb-3">{t('profile.preferencesSection')}</h2>
        <form onSubmit={savePreferences}>
          <div className="mb-3">
            <label htmlFor="language" className="form-label">{t('common.language')}</label>
            <select id="language" name="language" className="form-select" defaultValue={user.language}>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="theme" className="form-label">{t('common.theme')}</label>
            <select id="theme" name="theme" className="form-select" defaultValue={user.theme}>
              <option value="light">{t('common.themeLight')}</option>
              <option value="dark">{t('common.themeDark')}</option>
              <option value="system">{t('common.themeSystem')}</option>
            </select>
          </div>
          <button type="submit" className="btn btn-nf-primary" disabled={busy}>
            {t('common.save')}
          </button>
        </form>
      </div>

      <div className="nf-card nf-card--pad">
        <h2 className="h6 mb-3">{t('profile.passwordSection')}</h2>
        <form onSubmit={changePassword}>
          <Field label={t('profile.currentPassword')} name="current" type="password" required autoComplete="current-password" />
          <Field label={t('profile.newPassword')} name="next" type="password" required minLength={8} autoComplete="new-password" />
          <button type="submit" className="btn btn-nf-primary" disabled={busy}>
            {t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
