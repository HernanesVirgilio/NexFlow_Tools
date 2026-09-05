import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Brand } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const NAV = [
  { to: '/', key: 'dashboard', end: true },
  { to: '/workflows', key: 'workflows', end: false },
  { to: '/executions', key: 'executions', end: false },
  { to: '/profile', key: 'profile', end: false },
] as const;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="nf-shell">
      <aside className="nf-sidebar">
        <div className="mb-3">
          <Brand light />
        </div>
        <nav className="d-flex flex-column gap-1 flex-grow-1">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="nf-sidebar__spacer flex-grow-1" />
        <button className="btn btn-sm btn-outline-light" onClick={() => void logout()}>
          {t('nav.logout')}
        </button>
      </aside>

      <div className="nf-main">
        <header className="nf-topbar">
          <span className="text-muted small">{user?.email}</span>
          <div className="d-flex align-items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="nf-content">
          <div className="container-fluid px-0 nf-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
