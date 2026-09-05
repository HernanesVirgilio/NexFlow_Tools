import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../../components/ui/Brand';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { IntelligenceCore } from './IntelligenceCore';

type Mode = 'login' | 'register';

/**
 * Sliding-panel authentication. `/login` and `/register` both render this.
 * The mode tabs and the branded-overlay slide are two views of one state:
 * switching animates the overlay without a page reload and keeps the URL
 * in sync (`is-register` state class drives the CSS). The whole thing is
 * composed to fit inside one viewport on desktop — no page scroll.
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
    if (next === mode) return;
    setMode(next);
    navigate(next === 'login' ? '/login' : '/register', { replace: true, state: location.state });
  };

  const isRegister = mode === 'register';

  return (
    <div className="nf-authstage">
      <header className="nf-authstage__top">
        <Brand />
        <div className="nf-authstage__chrome">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="nf-authstage__main">
        <div className={`nf-slide${isRegister ? ' is-register' : ''}`}>
          <div className="nf-slide__formcol">
            <div className="nf-authtabs" role="tablist" aria-label={t('auth.tabs.label')}>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister ? 'false' : 'true'}
                className={`nf-authtabs__tab${!isRegister ? ' is-active' : ''}`}
                onClick={() => switchTo('login')}
              >
                {t('auth.signIn')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister ? 'true' : 'false'}
                className={`nf-authtabs__tab${isRegister ? ' is-active' : ''}`}
                onClick={() => switchTo('register')}
              >
                {t('auth.createAccount')}
              </button>
            </div>

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
                <span className="nf-slide__eyebrow">{t('auth.panel.platformLabel')}</span>
                <h2 className="nf-slide__headline">
                  {t('auth.panel.headlineA')}
                  <br />
                  {t('auth.panel.headlineB')}
                  <br />
                  <span className="nf-slide__headline-accent">{t('auth.panel.headlineC')}</span>
                </h2>
                <p className="nf-slide__lead">{t('auth.panel.lead')}</p>
              </div>

              <IntelligenceCore key={mode} mode={isRegister ? 'automate' : 'connect'} />
            </div>
          </div>
        </div>
      </main>

      <footer className="nf-authstage__foot">
        <span className="nf-authstage__foot-brand">{t('brand')}</span>
        <span>{t('auth.footer.tagline')}</span>
        <span className="nf-authstage__foot-trust">{t('auth.footer.trust')}</span>
      </footer>
    </div>
  );
}
