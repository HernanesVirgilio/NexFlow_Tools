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

/** Semantic tool-icon category — see --nf-icon-* in styles/themes/*.css. Never a raw colour here. */
type IconTone = 'automation' | 'intelligence' | 'integration' | 'data' | 'history' | 'template' | 'neutral';

type NavItem = {
  key: string;
  icon: IconName;
  to: string;
  end?: boolean;
  /** Omit for a neutral icon (e.g. Home) — not every item needs a category tint. */
  tone?: IconTone;
};

// Every item here routes to a real, working page — no "Em breve" entries.
// A capability without a backend (AI Agents, Files, API Keys, Logs) has no
// place on this list until it actually exists; see docs/development.md.
const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'workspace',
    items: [
      { to: '/', key: 'dashboard', icon: 'dashboard', end: true },
      { to: '/workflows', key: 'workflows', icon: 'workflows', tone: 'automation' },
      { to: '/executions', key: 'executions', icon: 'executions', tone: 'history' },
      { to: '/templates', key: 'templates', icon: 'templates', tone: 'template' },
      { to: '/integrations', key: 'integrations', icon: 'link', tone: 'integration' },
    ],
  },
  {
    label: 'account',
    items: [{ to: '/settings', key: 'settings', icon: 'settings', tone: 'neutral' }],
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
  const label = t(`nav.${item.key}`);
  const icon = (
    <span className={`nf-navicon${item.tone ? ` nf-navicon--${item.tone}` : ''}`}>
      <Icon name={item.icon} />
    </span>
  );

  return (
    <NavLink to={item.to} end={item.end} className="nf-navlink" aria-label={label} title={collapsed ? label : undefined}>
      {icon}
      <span className="nf-navlink__text">{label}</span>
    </NavLink>
  );
}

function Shell({ collapsed, onToggleCollapsed }: { collapsed: boolean; onToggleCollapsed: () => void }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
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
              aria-label={t('nav.functionalities')}
              title={collapsed ? t('nav.functionalities') : undefined}
            >
              <span className="nf-navicon"><Icon name="grid" /></span>
              <span className="nf-navlink__text">{t('nav.functionalities')}</span>
            </button>
            {funcOpen && <FunctionalitiesPanel onClose={() => setFuncOpen(false)} />}
          </div>
          <button
            type="button"
            className="nf-navlink nf-sidebar__collapse"
            onClick={onToggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
            title={collapsed ? t('nav.expand') : undefined}
          >
            <span className="nf-navicon"><Icon name={collapsed ? 'chevron-right' : 'chevron-left'} /></span>
            <span className="nf-navlink__text">{t('nav.collapse')}</span>
          </button>
          <button
            type="button"
            className="nf-navlink nf-sidebar__logout"
            onClick={() => void logout()}
            aria-label={t('nav.logout')}
            title={collapsed ? t('nav.logout') : undefined}
          >
            <span className="nf-navicon"><Icon name="logout" /></span>
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

  return <Shell collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />;
}
