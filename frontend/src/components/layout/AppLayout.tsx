import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Brand } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { DemoBanner } from '../ui/DemoBanner';
import { Icon, type IconName } from '../ui/Icon';

type NavItem = { to: string; key: string; icon: IconName; end?: boolean };

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'workspace',
    items: [
      { to: '/', key: 'dashboard', icon: 'dashboard', end: true },
      { to: '/workflows', key: 'workflows', icon: 'workflows' },
      { to: '/executions', key: 'executions', icon: 'executions' },
    ],
  },
  {
    label: 'account',
    items: [{ to: '/profile', key: 'profile', icon: 'profile' }],
  },
];

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="nf-shell">
      <aside className="nf-sidebar">
        <div className="nf-sidebar__brand">
          <Brand light />
        </div>
        <nav className="nf-sidebar__nav" aria-label={t('nav.workspace')}>
          {SECTIONS.map((section) => (
            <div key={section.label} className="nf-sidebar__group">
              <span className="nf-sidebar__group-label">{t(`nav.${section.label}`)}</span>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="nf-navlink">
                  <Icon name={item.icon} />
                  <span>{t(`nav.${item.key}`)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button className="btn btn-sm btn-outline-light nf-sidebar__logout" onClick={() => void logout()}>
          {t('nav.logout')}
        </button>
      </aside>

      <div className="nf-main">
        <DemoBanner />
        <header className="nf-topbar">
          <span className="text-muted small text-truncate">{user?.email}</span>
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
