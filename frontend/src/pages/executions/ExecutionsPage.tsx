import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { executionService } from '../../services/execution.service';
import type { ExecutionStatus } from '../../services/types';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';
import { formatDateTime, formatDuration } from '../../utils/format';

const STATUSES: ExecutionStatus[] = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'];

export function ExecutionsPage() {
  const { t, i18n } = useTranslation();
  const state = useAsync(() => executionService.list(100), []);
  const [filter, setFilter] = useState<ExecutionStatus | 'all'>('all');

  return (
    <div className="nf-execpage">
      <PageHeader title={t('executions.title')} />
      <p className="nf-execpage__lead">{t('executions.subtitle')}</p>

      <AsyncBoundary state={state} skeleton={<TableSkeleton />}>
        {(executions) => {
          if (executions.length === 0) {
            return (
              <div className="nf-card nf-card--pad">
                <EmptyState title={t('executions.emptyTitle')} message={t('executions.empty')} />
              </div>
            );
          }

          const filtered = filter === 'all' ? executions : executions.filter((e) => e.status === filter);

          return (
            <>
              <div className="nf-execpage__toolbar">
                <div className="nf-templates__filters" role="group" aria-label={t('common.status')}>
                  <button
                    type="button"
                    className={`nf-chip${filter === 'all' ? ' is-active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    {t('executions.filterAll')}
                  </button>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`nf-chip${filter === s ? ' is-active' : ''}`}
                      onClick={() => setFilter(s)}
                    >
                      {t(`executions.${s}`)}
                    </button>
                  ))}
                </div>
                <span className="nf-execpage__count">
                  {t('executions.count', { count: filtered.length })}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="nf-card nf-card--pad">
                  <EmptyState
                    title={t('executions.noResults')}
                    message={t('executions.noResultsBody')}
                  />
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
                        {filtered.map((ex) => (
                          <tr key={ex.id}>
                            <td>
                              {ex.workflow ? (
                                <Link to={`/workflows/${ex.workflow.id}`}>{ex.workflow.name}</Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <StatusBadge status={ex.status} />
                            </td>
                            <td className="d-none d-sm-table-cell text-muted small">
                              {formatDateTime(ex.startedAt ?? ex.createdAt, i18n.language)}
                            </td>
                            <td className="d-none d-md-table-cell text-muted small">
                              {formatDuration(ex.durationMs)}
                            </td>
                            <td className="small text-truncate nf-truncate-sm">
                              {ex.errorMessage ? (
                                <span className="text-danger">{ex.errorMessage}</span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-end">
                              <Link
                                to={`/executions/${ex.id}`}
                                className="btn btn-sm btn-outline-secondary"
                                aria-label={t('executions.viewDetail')}
                              >
                                <Icon name="arrow-right" size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="nf-card nf-card--pad" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="d-flex align-items-center gap-3 py-2">
          <Skeleton w="30%" h="1rem" />
          <Skeleton w="90px" h="1.2rem" pill />
          <Skeleton w="20%" h="0.85rem" />
        </div>
      ))}
    </div>
  );
}
