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
import { ProfileMenu } from './ProfileMenu';
import { FunctionalitiesPanel } from './FunctionalitiesPanel';
import { ConnectToolsModal } from './ConnectToolsModal';
import { ConnectToolsProvider, useConnectTools } from '../../context/ConnectToolsContext';

type NavItem = {
  key: string;
  icon: IconName;
  to?: string;
  end?: boolean;
  soon?: boolean;
  action?: 'connect';
};

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'workspace',
    items: [
      { to: '/', key: 'dashboard', icon: 'dashboard', end: true },
      { to: '/workflows', key: 'workflows', icon: 'workflows' },
      { to: '/executions', key: 'executions', icon: 'executions' },
      { to: '/templates', key: 'templates', icon: 'templates' },
      { key: 'integrations', icon: 'link', action: 'connect' },
    ],
  },
  {
    label: 'intelligence',
    items: [{ key: 'agents', icon: 'agent', soon: true }],
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
      { to: '/settings', key: 'settings', icon: 'settings' },
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

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation();
  const { openModal } = useConnectTools();
  const label = t(`nav.${item.key}`);

  if (item.action === 'connect') {
    return (
      <button
        type="button"
        className="nf-navlink"
        onClick={openModal}
        title={collapsed ? label : undefined}
      >
        <Icon name={item.icon} />
        <span className="nf-navlink__text">{label}</span>
      </button>
    );
  }
  if (item.soon) {
    return (
      <span className="nf-navlink nf-navlink--soon" aria-disabled="true" title={collapsed ? label : undefined}>
        <Icon name={item.icon} />
        <span className="nf-navlink__text">{label}</span>
        <span className="nf-navlink__soon">{t('nav.soon')}</span>
      </span>
    );
  }
  return (
    <NavLink to={item.to!} end={item.end} className="nf-navlink" title={collapsed ? label : undefined}>
      <Icon name={item.icon} />
      <span className="nf-navlink__text">{label}</span>
    </NavLink>
  );
}

function Shell({ collapsed, onToggleCollapsed }: { collapsed: boolean; onToggleCollapsed: () => void }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { open, closeModal } = useConnectTools();
  const [funcOpen, setFuncOpen] = useState(false);

  return (
    <div className={`nf-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="nf-sidebar">
        <div className="nf-sidebar__brand">
          {collapsed ? (
            <span className="nf-brand__dot" />
          ) : (
            <>
              <Brand />
              <span className="nf-sidebar__tagline">{t('tagline')}</span>
            </>
          )}
        </div>

        <nav className="nf-sidebar__nav" aria-label={t('nav.workspace')}>
          {SECTIONS.map((section) => (
            <div key={section.label} className="nf-sidebar__group">
              <span className="nf-sidebar__group-label">{t(`nav.${section.label}`)}</span>
              {section.items.map((item) => (
                <NavRow key={item.key} item={item} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        <div className="nf-sidebar__foot">
          <div
            className="nf-func-anchor"
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFuncOpen(false)}
          >
            <button
              type="button"
              className="nf-navlink"
              onClick={() => setFuncOpen((o) => !o)}
              aria-expanded={funcOpen}
              aria-haspopup="dialog"
              title={collapsed ? t('nav.functionalities') : undefined}
            >
              <Icon name="grid" />
              <span className="nf-navlink__text">{t('nav.functionalities')}</span>
            </button>
            {funcOpen && <FunctionalitiesPanel onClose={() => setFuncOpen(false)} />}
          </div>
          <button
            type="button"
            className="nf-navlink nf-sidebar__collapse"
            onClick={onToggleCollapsed}
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
            <ProfileMenu />
          </div>
        </header>
        <main className="nf-content">
          <div className="container-fluid px-0 nf-container">
            <Outlet />
          </div>
        </main>
      </div>

      <ConnectToolsModal open={open} onClose={closeModal} />
    </div>
  );
}

export function AppLayout() {
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
    <ConnectToolsProvider>
      <Shell collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
    </ConnectToolsProvider>
  );
}
