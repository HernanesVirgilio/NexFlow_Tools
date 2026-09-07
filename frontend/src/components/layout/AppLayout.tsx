import { useState } from 'react';
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
      { key: 'agents', icon: 'agent', soon: true },
      { key: 'templates', icon: 'templates', soon: true },
      { key: 'integrations', icon: 'link', soon: true },
    ],
  },
  {
    label: 'data',
    items: [{ key: 'dataStorage', icon: 'database', soon: true }],
  },
  {
    label: 'account',
    items: [
      { key: 'apiKeys', icon: 'key', soon: true },
      { key: 'logs', icon: 'list', soon: true },
      { to: '/profile', key: 'settings', icon: 'settings' },
    ],
  },
];

const COLLAPSE_KEY = 'nf_sidebar_collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function initials(name?: string, email?: string) {
  const src = (name?.trim() || email || '?').trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? '?').concat(parts[1]?.[0] ?? '').toUpperCase();
}

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className={`nf-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="nf-sidebar">
        <div className="nf-sidebar__brand">{collapsed ? <span className="nf-brand__dot" /> : <Brand light />}</div>

        <nav className="nf-sidebar__nav" aria-label={t('nav.workspace')}>
          {SECTIONS.map((section) => (
            <div key={section.label} className="nf-sidebar__group">
              <span className="nf-sidebar__group-label">{t(`nav.${section.label}`)}</span>
              {section.items.map((item) =>
                item.soon ? (
                  <span
                    key={item.key}
                    className="nf-navlink nf-navlink--soon"
                    aria-disabled="true"
                    title={collapsed ? t(`nav.${item.key}`) : undefined}
                  >
                    <Icon name={item.icon} />
                    <span className="nf-navlink__text">{t(`nav.${item.key}`)}</span>
                    <span className="nf-navlink__soon">{t('nav.soon')}</span>
                  </span>
                ) : (
                  <NavLink
                    key={item.key}
                    to={item.to!}
                    end={item.end}
                    className="nf-navlink"
                    title={collapsed ? t(`nav.${item.key}`) : undefined}
                  >
                    <Icon name={item.icon} />
                    <span className="nf-navlink__text">{t(`nav.${item.key}`)}</span>
                  </NavLink>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className="nf-sidebar__foot">
          <button
            type="button"
            className="nf-navlink nf-sidebar__collapse"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
          >
            <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
            <span className="nf-navlink__text">{t('nav.collapse')}</span>
          </button>
          <button
            type="button"
            className="nf-navlink nf-sidebar__logout"
            onClick={() => void logout()}
            title={collapsed ? t('nav.logout') : undefined}
          >
            <Icon name="logout" />
            <span className="nf-navlink__text">{t('nav.logout')}</span>
          </button>
        </div>
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
