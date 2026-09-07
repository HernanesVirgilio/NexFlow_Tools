import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Brand } from '../ui/Brand';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { DemoBanner } from '../ui/DemoBanner';
import { Icon, type IconName } from '../ui/Icon';
import { WorkspaceSearch } from './WorkspaceSearch';

type NavItem = { key: string; icon: IconName; to?: string; end?: boolean; soon?: boolean };

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
    label: 'intelligence',
    items: [
      { key: 'templates', icon: 'templates', soon: true },
      { key: 'integrations', icon: 'link', soon: true },
      { key: 'agents', icon: 'agent', soon: true },
    ],
  },
  {
    label: 'account',
    items: [{ to: '/profile', key: 'settings', icon: 'settings' }],
  },
];

function initials(name?: string, email?: string) {
  const src = (name?.trim() || email || '?').trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? '?').concat(parts[1]?.[0] ?? '').toUpperCase();
}

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
              {section.items.map((item) =>
                item.soon ? (
                  <span key={item.key} className="nf-navlink nf-navlink--soon" aria-disabled="true">
                    <Icon name={item.icon} />
                    <span>{t(`nav.${item.key}`)}</span>
                    <span className="nf-navlink__soon">{t('nav.soon')}</span>
                  </span>
                ) : (
                  <NavLink key={item.key} to={item.to!} end={item.end} className="nf-navlink">
                    <Icon name={item.icon} />
                    <span>{t(`nav.${item.key}`)}</span>
                  </NavLink>
                ),
              )}
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
          <WorkspaceSearch />
          <div className="nf-topbar__right">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="nf-avatar" title={user?.email} aria-hidden="true">
              {initials(user?.name, user?.email)}
            </span>
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
