import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api';
import { authService, SOCIAL_PROVIDERS, type SocialProvider } from '../../services/auth.service';

/**
 * Compact social sign-in row. The backend endpoint is reserved but not wired to
 * an OAuth provider yet, so a click surfaces a clear message — it never fakes a
 * successful login. UI is built ready for the real flow (loading / disabled /
 * error states per provider).
 */
export function SocialAuthButtons() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(provider: SocialProvider) {
    setPending(provider);
    setError(null);
    try {
      await authService.socialLogin(provider);
      // Unreachable today — no provider resolves. Kept for the real integration.
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SOCIAL_AUTH_NOT_CONFIGURED') {
        setError(t('auth.social.notConfigured'));
      } else {
        setError(t('auth.social.error'));
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="nf-social">
      <div className="nf-social__divider">
        <span>{t('auth.social.divider')}</span>
      </div>

      <div className="nf-social__row" role="group" aria-label={t('auth.social.divider')}>
        {SOCIAL_PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            className="btn nf-social__btn"
            onClick={() => start(provider)}
            disabled={pending !== null}
            aria-busy={pending === provider}
            aria-label={t(`auth.social.${provider}`)}
            title={t(`auth.social.${provider}`)}
          >
            {pending === provider ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <ProviderIcon provider={provider} />
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="nf-social__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ProviderIcon({ provider }: { provider: SocialProvider }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  switch (provider) {
    case 'google':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 10.2v3.9h5.5c-.24 1.4-1.68 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17 2.9 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z" />
        </svg>
      );
    case 'github':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common} fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...common} fill="currentColor">
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.02 4.13H5.06l12.02 15.64z" />
        </svg>
      );
  }
}
