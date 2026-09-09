import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { workflowService } from '../../services/workflow.service';
import type { Workflow } from '../../services/types';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';
import { useErrorMessage } from '../../components/ui/ErrorState';
import { formatDateTime } from '../../utils/format';

type StatusFilter = 'all' | 'active' | 'inactive';

export function WorkflowsListPage() {
  const { t, i18n } = useTranslation();
  const toMessage = useErrorMessage();
  const state = useAsync(() => workflowService.list(), []);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  async function run(w: Workflow) {
    setRunningId(w.id);
    setNotice(null);
    try {
      await workflowService.execute(w.id);
      setNotice({ type: 'success', text: t('workflows.runStarted') });
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="nf-wfpage">
      <PageHeader
        title={t('workflows.title')}
        actions={
          <Link to="/workflows/new" className="btn btn-nf-primary">
            <Icon name="plus" size={16} />
            {t('workflows.new')}
          </Link>
        }
      />
      <p className="nf-wfpage__lead">{t('workflows.subtitle')}</p>

      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="status">
          {notice.text}
        </div>
      )}

      <AsyncBoundary state={state} skeleton={<ListSkeleton />}>
        {(workflows) => {
          if (workflows.length === 0) {
            return (
              <div className="nf-card nf-card--pad">
                <EmptyState
                  title={t('workflows.emptyTitle')}
                  message={t('workflows.empty')}
                  action={
                    <Link to="/workflows/new" className="btn btn-nf-primary">
                      {t('workflows.new')}
                    </Link>
                  }
                />
              </div>
            );
          }

          const q = query.trim().toLowerCase();
          const filtered = workflows.filter((w) => {
            if (status === 'active' && !w.isActive) return false;
            if (status === 'inactive' && w.isActive) return false;
            if (q && !`${w.name} ${w.description ?? ''}`.toLowerCase().includes(q)) return false;
            return true;
          });

          return (
            <>
              <div className="nf-wfpage__toolbar">
                <div className="nf-search nf-search--inline">
                  <Icon name="search" size={15} />
                  <input
                    className="nf-search__input"
                    placeholder={t('workflows.searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label={t('workflows.searchPlaceholder')}
                  />
                </div>
                <div className="nf-templates__filters" role="group" aria-label={t('common.status')}>
                  {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`nf-chip${status === s ? ' is-active' : ''}`}
                      onClick={() => setStatus(s)}
                    >
                      {t(`workflows.filter_${s}`)}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="nf-card nf-card--pad">
                  <EmptyState title={t('workflows.noResults')} message={t('workflows.noResultsBody')} />
                </div>
              ) : (
                <ul className="nf-wflist">
                  {filtered.map((w) => {
                    const last = w.executions?.[0];
                    return (
                      <li key={w.id} className="nf-wfrow">
                        <div className="nf-wfrow__main">
                          <Link to={`/workflows/${w.id}`} className="nf-wfrow__name">
                            {w.name}
                          </Link>
                          {w.description && <p className="nf-wfrow__desc">{w.description}</p>}
                          <div className="nf-wfrow__meta">
                            <span
                              className={`nf-status ${
                                w.isActive ? 'nf-status--completed' : 'nf-status--pending'
                              }`}
                            >
                              {w.isActive ? t('workflows.active') : t('workflows.inactive')}
                            </span>
                            <span>{t('workflows.executionsCount', { count: w._count?.executions ?? 0 })}</span>
                            {last ? (
                              <span className="nf-wfrow__last">
                                <StatusBadge status={last.status} />
                                {formatDateTime(last.createdAt, i18n.language)}
                              </span>
                            ) : (
                              <span>{t('workflows.neverRun')}</span>
                            )}
                          </div>
                        </div>
                        <div className="nf-wfrow__actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => void run(w)}
                            disabled={runningId === w.id}
                          >
                            <Icon name="play" size={14} />
                            {t('workflows.run')}
                          </button>
                          <Link
                            to={`/workflows/${w.id}/builder`}
                            className="btn btn-sm btn-outline-secondary"
                          >
                            {t('workflows.open')}
                          </Link>
                          <Link
                            to={`/workflows/${w.id}`}
                            className="btn btn-sm btn-outline-secondary"
                            aria-label={t('common.details')}
                          >
                            <Icon name="more" size={14} />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          );
        }}
      </AsyncBoundary>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="nf-wflist" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="nf-wfrow">
          <div className="nf-wfrow__main">
            <Skeleton w="40%" h="1.1rem" />
            <Skeleton w="65%" h="0.85rem" className="mt-2" />
            <Skeleton w="30%" h="0.8rem" className="mt-2" />
          </div>
          <Skeleton w="180px" h="2rem" pill />
        </li>
      ))}
    </ul>
  );
}
