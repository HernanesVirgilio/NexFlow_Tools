import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../hooks/useAsync';
import { dashboardService } from '../services/dashboard.service';
import { AsyncBoundary } from '../components/ui/AsyncBoundary';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDateTime } from '../utils/format';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="col-12 col-sm-4">
      <div className="nf-card nf-card--pad h-100">
        <div className="nf-stat__label">{label}</div>
        <div className="nf-stat__value">{value}</div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const state = useAsync(() => dashboardService.summary(), []);

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        actions={
          <Link to="/workflows/new" className="btn btn-nf-primary">
            {t('dashboard.createWorkflow')}
          </Link>
        }
      />

      <AsyncBoundary state={state}>
        {(data) => (
          <>
            <div className="row g-3 mb-4">
              <Stat label={t('dashboard.totalWorkflows')} value={data.totals.workflows} />
              <Stat label={t('dashboard.activeWorkflows')} value={data.totals.activeWorkflows} />
              <Stat label={t('dashboard.totalExecutions')} value={data.totals.executions} />
            </div>

            {data.totals.workflows === 0 ? (
              <div className="nf-card nf-card--pad">
                <EmptyState
                  message={t('dashboard.empty')}
                  action={
                    <Link to="/workflows/new" className="btn btn-nf-primary">
                      {t('dashboard.createWorkflow')}
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div className="nf-card nf-card--pad h-100">
                    <h2 className="h6 mb-3">{t('dashboard.recentWorkflows')}</h2>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                      {data.recentWorkflows.map((w) => (
                        <li key={w.id} className="d-flex justify-content-between align-items-center">
                          <Link to={`/workflows/${w.id}`}>{w.name}</Link>
                          <span className="text-muted small">
                            {w.isActive ? t('workflows.active') : t('workflows.inactive')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="nf-card nf-card--pad h-100">
                    <h2 className="h6 mb-3">{t('dashboard.recentExecutions')}</h2>
                    {data.recentExecutions.length === 0 ? (
                      <p className="text-muted small mb-0">{t('executions.empty')}</p>
                    ) : (
                      <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                        {data.recentExecutions.map((ex) => (
                          <li key={ex.id} className="d-flex justify-content-between align-items-center">
                            <span className="text-truncate me-2">{ex.workflow?.name ?? '—'}</span>
                            <span className="d-flex align-items-center gap-2">
                              <span className="text-muted small d-none d-sm-inline">
                                {formatDateTime(ex.createdAt, i18n.language)}
                              </span>
                              <StatusBadge status={ex.status} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
