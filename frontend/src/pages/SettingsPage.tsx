import { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/user.service';
import { Field } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { Icon, type IconName } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';
import type { Language } from '../i18n';
import i18n from '../i18n';

function Section({ id, icon, title, children }: { id: string; icon: IconName; title: string; children: ReactNode }) {
  return (
    <section id={id} className="nf-card nf-card--pad nf-settings__section">
      <h2 className="nf-settings__title">
        <Icon name={icon} size={17} />
        {title}
      </h2>
      {children}
    </section>
  );
}

// Every section below maps to something the backend actually does — account/
// profile updates, language/theme (Profile.language/theme), password change.
// A setting with no backend behind it (automatic retries, notifications,
// timezone, API keys, sessions list…) does not get a section here instead of
// being built; see docs/development.md "Still ahead" for what's genuinely next.
export function SettingsPage() {
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
    <div className="nf-settings">
      <PageHeader title={t('settings.title')} />
      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="alert">
          {notice.text}
        </div>
      )}

      <nav className="nf-settings__index" aria-label={t('settings.title')}>
        {[
          ['account', 'profile'],
          ['preferences', 'settings'],
          ['security', 'key'],
        ].map(([id]) => (
          <a key={id} href={`#${id}`}>
            {t(`settings.sections.${id}`)}
          </a>
        ))}
      </nav>

      <div className="nf-settings__body">
        <Section id="account" icon="profile" title={t('settings.sections.account')}>
          <form onSubmit={saveAccount}>
            <Field label={t('common.name')} name="name" defaultValue={user.name} required />
            <Field label={t('auth.email')} name="email" defaultValue={user.email} disabled />
            <Field label={t('profile.avatarUrl')} name="avatarUrl" type="url" defaultValue={user.avatarUrl ?? ''} />
            <button type="submit" className="btn btn-nf-primary" disabled={busy}>
              {t('common.save')}
            </button>
          </form>
        </Section>

        <Section id="preferences" icon="settings" title={t('settings.sections.preferences')}>
          <form onSubmit={savePreferences}>
            <div className="mb-3">
              <label htmlFor="language" className="form-label">
                {t('common.language')}
              </label>
              <select id="language" name="language" className="form-select" defaultValue={user.language}>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="theme" className="form-label">
                {t('common.theme')}
              </label>
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
        </Section>

        <Section id="security" icon="key" title={t('settings.sections.security')}>
          <form onSubmit={changePassword}>
            <Field label={t('profile.currentPassword')} name="current" type="password" required autoComplete="current-password" />
            <Field label={t('profile.newPassword')} name="next" type="password" required minLength={8} autoComplete="new-password" />
            <button type="submit" className="btn btn-nf-primary" disabled={busy}>
              {t('common.save')}
            </button>
          </form>
          <p className="nf-settings__note">{t('settings.securityNote')}</p>
        </Section>

        <Section id="integrations" icon="link" title={t('settings.sections.integrations')}>
          <p className="nf-settings__note mb-3">{t('settings.integrations.hint')}</p>
          <Link to="/integrations" className="btn btn-outline-secondary btn-sm">
            <Icon name="link" size={14} />
            {t('settings.integrations.manage')}
          </Link>
        </Section>
      </div>
    </div>
  );
}
