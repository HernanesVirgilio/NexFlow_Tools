import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { executionService } from '../../services/execution.service';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';
import { formatDateTime, formatDuration } from '../../utils/format';

export function ExecutionsPage() {
  const { t, i18n } = useTranslation();
  const state = useAsync(() => executionService.list(100), []);

  return (
    <div>
      <PageHeader title={t('executions.title')} />
      <AsyncBoundary state={state}>
        {(executions) =>
          executions.length === 0 ? (
            <div className="nf-card nf-card--pad">
              <EmptyState message={t('executions.empty')} />
            </div>
          ) : (
            <div className="nf-card">
              <div className="table-responsive nf-table-wrap">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>{t('executions.workflow')}</th>
                      <th>{t('common.status')}</th>
                      <th className="d-none d-sm-table-cell">{t('executions.startedAt')}</th>
                      <th className="d-none d-md-table-cell">{t('executions.duration')}</th>
                      <th>{t('executions.error')}</th>
                      <th className="text-end">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((ex) => (
                      <tr key={ex.id}>
                        <td>
                          {ex.workflow ? (
                            <Link to={`/workflows/${ex.workflow.id}`}>{ex.workflow.name}</Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td><StatusBadge status={ex.status} /></td>
                        <td className="d-none d-sm-table-cell text-muted small">
                          {formatDateTime(ex.startedAt ?? ex.createdAt, i18n.language)}
                        </td>
                        <td className="d-none d-md-table-cell text-muted small">
                          {formatDuration(ex.durationMs)}
                        </td>
                        <td className="text-danger small text-truncate nf-truncate-sm">
                          {ex.errorMessage ?? '—'}
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/executions/${ex.id}`}
                            className="btn btn-sm btn-outline-secondary"
                            aria-label={t('execution.viewExecution')}
                          >
                            <Icon name="chevron-right" size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      </AsyncBoundary>
    </div>
  );
}
