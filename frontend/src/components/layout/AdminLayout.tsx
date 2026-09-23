import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Brand } from '../ui/Brand';
import { Icon, type IconName } from '../ui/Icon';

const ADMIN_NAV: { key: string; icon: IconName; to: string; end?: boolean }[] = [
  { key: 'overview', icon: 'dashboard', to: '/admin', end: true },
];

/**
 * NexFlow Administration shell — deliberately its own layout, not the user
 * AppLayout with extra links bolted on. Only sections that are actually
 * implemented appear in ADMIN_NAV (see ERN-05).
 */
export function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="nf-admin">
      <header className="nf-admin__topbar">
        <div className="nf-admin__brand">
          <Brand light />
          <span className="nf-admin__badge">{t('admin.badge')}</span>
        </div>
        <nav className="nf-admin__nav" aria-label={t('admin.navLabel')}>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.key} to={item.to} end={item.end} className="nf-admin__navlink">
              <Icon name={item.icon} size={15} />
              {t(`admin.nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="nf-admin__right">
          <span className="nf-admin__user">{user?.email}</span>
          <Link to="/" className="nf-admin__exit">
            <Icon name="arrow-left" size={14} />
            {t('admin.exitToWorkspace')}
          </Link>
          <button
            type="button"
            className="nf-admin__logout"
            onClick={() => void logout()}
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </header>
      <main className="nf-admin__content">
        <Outlet />
      </main>
    </div>
  );
}
