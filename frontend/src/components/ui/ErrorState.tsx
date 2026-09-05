import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api';

interface Props {
  error: unknown;
  onRetry?: () => void;
}

/** Turns any thrown error into a safe, translated message. */
export function useErrorMessage() {
  const { t } = useTranslation();
  return (error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.code === 'NETWORK') return t('errors.network');
      if (error.status === 401) return t('errors.unauthorized');
      // Backend messages are already client-safe.
      return error.message && error.message !== 'generic' ? error.message : t('errors.generic');
    }
    return t('errors.generic');
  };
}

export function ErrorState({ error, onRetry }: Props) {
  const { t } = useTranslation();
  const toMessage = useErrorMessage();
  return (
    <div className="nf-state">
      <div className="nf-state__title">{t('states.errorTitle')}</div>
      <p className="mb-3">{toMessage(error)}</p>
      {onRetry && (
        <button className="btn btn-outline-secondary btn-sm" onClick={onRetry}>
          {t('states.retry')}
        </button>
      )}
    </div>
  );
}
