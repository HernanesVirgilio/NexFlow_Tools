import { useTranslation } from 'react-i18next';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';
import { userService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';

const ORDER: ThemePreference[] = ['light', 'dark', 'system'];
const ICON: Record<ThemePreference, string> = { light: '☀', dark: '☾', system: '⌘' };

export function ThemeToggle() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  const { user, setUser } = useAuth();

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
    setPreference(next);
    if (user) {
      void userService.updateProfile({ theme: next }).then(setUser).catch(() => undefined);
    }
  };

  return (
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={cycle}
      title={t(`common.theme${preference[0].toUpperCase()}${preference.slice(1)}`)}
      aria-label={t('common.theme')}
    >
      {ICON[preference]}
    </button>
  );
}
