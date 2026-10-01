import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';

function initials(name?: string, email?: string) {
  const src = (name?.trim() || email || '?').trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? '?').concat(parts[1]?.[0] ?? '').toUpperCase();
}

export function ProfileMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="nf-profilemenu" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button
        type="button"
        className="nf-avatar nf-avatar--btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user?.name || user?.email || t('nav.account')}
      >
        {initials(user?.name, user?.email)}
      </button>
      {open && (
        <div className="nf-profilemenu__pop" role="menu">
          <div className="nf-profilemenu__head">
            <span className="nf-profilemenu__name">{user?.name}</span>
            <span className="nf-profilemenu__email">{user?.email}</span>
          </div>
          <Link to="/settings" className="nf-profilemenu__item" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="settings" size={15} />
            {t('nav.settings')}
          </Link>
          <button
            type="button"
            className="nf-profilemenu__item nf-profilemenu__item--danger"
            role="menuitem"
            onClick={() => void logout()}
          >
            <Icon name="logout" size={15} />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
