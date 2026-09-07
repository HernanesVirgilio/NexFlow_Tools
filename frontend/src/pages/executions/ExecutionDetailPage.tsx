import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { executionService } from '../../services/execution.service';
import { workflowService } from '../../services/workflow.service';
import type { WorkflowExecution } from '../../services/types';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ExecutionError } from '../../components/executions/ExecutionError';
import { useErrorMessage } from '../../components/ui/ErrorState';
import { formatDateTime, formatDuration } from '../../utils/format';

export function ExecutionDetailPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const state = useAsync<WorkflowExecution>(() => executionService.get(id), [id]);

  const [retrying, setRetrying] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  async function retry(workflowId: string) {
    setRetrying(true);
    setNotice(null);
    try {
      const exec = await workflowService.execute(workflowId);
      navigate(`/executions/${exec.id}`);
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('execution.title')}
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate('/executions')}>
            {t('common.back')}
          </button>
        }
      />
      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="alert">
          {notice.text}
        </div>
      )}

      <AsyncBoundary state={state}>
        {(ex) => (
          <div className="nf-card nf-card--pad">
            <dl className="nf-execdetail">
              <div>
                <dt>{t('executions.workflow')}</dt>
                <dd>
                  {ex.workflow ? (
                    <Link to={`/workflows/${ex.workflow.id}`}>{ex.workflow.name}</Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('common.status')}</dt>
                <dd>
                  <StatusBadge status={ex.status} />
                </dd>
              </div>
              <div>
                <dt>{t('executions.startedAt')}</dt>
                <dd>{ex.startedAt ? formatDateTime(ex.startedAt, i18n.language) : '—'}</dd>
              </div>
              <div>
                <dt>{t('executions.finishedAt')}</dt>
                <dd>{ex.finishedAt ? formatDateTime(ex.finishedAt, i18n.language) : '—'}</dd>
              </div>
              <div>
                <dt>{t('executions.duration')}</dt>
                <dd>{formatDuration(ex.durationMs)}</dd>
              </div>
              <div>
                <dt>{t('execution.engineRef')}</dt>
                <dd>
                  <code>{ex.engineRef ?? '—'}</code>
                </dd>
              </div>
            </dl>

            {ex.status === 'FAILED' && (
              <ExecutionError
                errorCode={ex.errorCode}
                errorMessage={ex.errorMessage}
                workflowId={ex.workflow?.id ?? ex.workflowId}
                executionId={ex.id}
                onRetry={() => void retry(ex.workflow?.id ?? ex.workflowId)}
                retrying={retrying}
                compact
              />
            )}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
