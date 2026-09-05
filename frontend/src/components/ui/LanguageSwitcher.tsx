import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';

const LABELS: Record<Language, string> = { en: 'EN', pt: 'PT' };

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { user, setUser } = useAuth();
  const current = (i18n.language?.slice(0, 2) as Language) || 'en';

  const change = (lang: Language) => {
    void i18n.changeLanguage(lang);
    if (user) void userService.updateProfile({ language: lang }).then(setUser).catch(() => undefined);
  };

  return (
    <div className="btn-group btn-group-sm" role="group" aria-label={t('common.language')}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          className={`btn btn-outline-secondary${current === lang ? ' active' : ''}`}
          onClick={() => change(lang)}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
