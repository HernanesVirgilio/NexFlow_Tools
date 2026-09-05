import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../../components/ui/Brand';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { AuthArt } from './AuthArt';

type Mode = 'login' | 'register';

/**
 * Sliding-panel authentication. `/login` and `/register` both render this;
 * switching between them animates the branded overlay without a page reload
 * and keeps the URL in sync (`is-register` state class drives the CSS).
 */
export function SlidingAuth({ initialMode }: { initialMode: Mode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(initialMode);

  // Keep local state aligned when the route changes (e.g. browser back/forward).
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchTo = (next: Mode) => {
    setMode(next);
    navigate(next === 'login' ? '/login' : '/register', { replace: true, state: location.state });
  };

  const isRegister = mode === 'register';

  return (
    <div className="nf-authstage">
      <div className="nf-authstage__chrome">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className={`nf-slide${isRegister ? ' is-register' : ''}`}>
        <div className="nf-slide__formcol">
          {isRegister ? (
            <RegisterForm key="register" onSwitch={() => switchTo('login')} />
          ) : (
            <LoginForm key="login" onSwitch={() => switchTo('register')} />
          )}
        </div>

        <div className="nf-slide__overlay">
          <div className="nf-slide__overlay-inner">
            <div className="nf-slide__overlay-lead">
              <Brand light />
              <h2 className="nf-slide__headline">{t('auth.panel.headline')}</h2>
              <p className="nf-slide__lead">{t('auth.panel.lead')}</p>
            </div>

            <AuthArt key={mode} mode={isRegister ? 'automate' : 'connect'} />

            <div className="nf-slide__overlay-swap" key={mode} aria-live="polite">
              <span className="nf-slide__swap-title">
                {isRegister ? t('auth.panel.toLoginTitle') : t('auth.panel.toRegisterTitle')}
              </span>
              <p className="nf-slide__swap-text">
                {isRegister ? t('auth.panel.toLoginText') : t('auth.panel.toRegisterText')}
              </p>
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={() => switchTo(isRegister ? 'login' : 'register')}
              >
                {isRegister ? t('auth.panel.toLoginCta') : t('auth.panel.toRegisterCta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
