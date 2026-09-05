import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="nf-auth">
      <aside className="nf-auth__aside">
        <Brand light />
        <h2 className="mt-4 mb-2 fw-bold">{t('tagline')}</h2>
        <p className="text-secondary nf-auth__lead">
          NexFlow Tools connects your apps, data and processes into automated flows you control.
        </p>
      </aside>
      <div className="nf-auth__panel">
        <div className="nf-auth__card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Brand />
            <div className="d-flex gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
