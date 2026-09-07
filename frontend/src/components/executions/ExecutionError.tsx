import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';

type Action = 'retry' | 'builder' | 'view';

/**
 * Honest failure recovery. Guidance is derived only from the stored
 * `errorCode` (a real AppError code). Unknown codes get the generic path —
 * never a fabricated technical explanation, never a leaked secret.
 */
const RECOVERY: Record<string, { cause: string; actions: Action[] }> = {
  AUTOMATION_AUTH: { cause: 'authRejected', actions: ['builder', 'view'] },
  AUTOMATION_TIMEOUT: { cause: 'timeout', actions: ['retry', 'view'] },
  AUTOMATION_UNAVAILABLE: { cause: 'unavailable', actions: ['retry', 'view'] },
  AUTOMATION_NOT_FOUND: { cause: 'notFound', actions: ['builder', 'view'] },
  AUTOMATION_INVALID_WORKFLOW: { cause: 'invalidWorkflow', actions: ['builder'] },
  AUTOMATION_EXECUTION_ERROR: { cause: 'engineError', actions: ['retry', 'view'] },
  AUTOMATION_UNKNOWN: { cause: 'generic', actions: ['retry', 'view'] },
  WORKFLOW_INVALID: { cause: 'invalidWorkflow', actions: ['builder'] },
};

interface Props {
  errorCode: string | null;
  errorMessage: string | null;
  workflowId: string | null;
  executionId?: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Hide the "View execution" action when already on the detail page. */
  compact?: boolean;
}

export function ExecutionError({
  errorCode,
  errorMessage,
  workflowId,
  executionId,
  onRetry,
  retrying,
  compact,
}: Props) {
  const { t } = useTranslation();
  const recovery = (errorCode && RECOVERY[errorCode]) || { cause: 'generic', actions: ['retry', 'view'] as Action[] };

  return (
    <div className="nf-execerror" role="alert">
      <div className="nf-execerror__head">
        <Icon name="alert" size={16} />
        <span>{t('execution.failed')}</span>
        {errorCode && <code className="nf-execerror__code">{errorCode}</code>}
      </div>

      <p className="nf-execerror__cause">{t(`execution.recovery.${recovery.cause}`)}</p>
      {errorMessage && <p className="nf-execerror__detail">{errorMessage}</p>}

      <div className="nf-execerror__actions">
        {recovery.actions.includes('retry') && onRetry && (
          <button type="button" className="btn btn-sm btn-nf-primary" onClick={onRetry} disabled={retrying}>
            {retrying ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <Icon name="retry" size={14} />
            )}
            {t('execution.retry')}
          </button>
        )}
        {recovery.actions.includes('builder') && workflowId && (
          <Link to={`/workflows/${workflowId}/builder`} className="btn btn-sm btn-outline-secondary">
            {t('execution.checkConfig')}
          </Link>
        )}
        {!compact && recovery.actions.includes('view') && executionId && (
          <Link to={`/executions/${executionId}`} className="btn btn-sm btn-outline-secondary">
            {t('execution.viewExecution')}
          </Link>
        )}
      </div>
    </div>
  );
}
