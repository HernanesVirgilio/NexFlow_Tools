import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { workflowService } from '../../services/workflow.service';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../utils/format';

export function WorkflowsListPage() {
  const { t, i18n } = useTranslation();
  const state = useAsync(() => workflowService.list(), []);

  return (
    <div>
      <PageHeader
        title={t('workflows.title')}
        actions={
          <Link to="/workflows/new" className="btn btn-nf-primary">
            {t('workflows.new')}
          </Link>
        }
      />

      <AsyncBoundary state={state}>
        {(workflows) =>
          workflows.length === 0 ? (
            <div className="nf-card nf-card--pad">
              <EmptyState
                message={t('workflows.empty')}
                action={
                  <Link to="/workflows/new" className="btn btn-nf-primary">
                    {t('workflows.new')}
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="nf-card">
              <div className="table-responsive nf-table-wrap">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>{t('common.name')}</th>
                      <th>{t('common.status')}</th>
                      <th className="d-none d-md-table-cell">{t('common.updatedAt')}</th>
                      <th className="text-end">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <Link to={`/workflows/${w.id}`} className="fw-medium">
                            {w.name}
                          </Link>
                          {w.description && (
                            <div className="text-muted small text-truncate nf-truncate-sm">
                              {w.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`nf-status ${w.isActive ? 'nf-status--completed' : 'nf-status--pending'}`}>
                            {w.isActive ? t('workflows.active') : t('workflows.inactive')}
                          </span>
                        </td>
                        <td className="d-none d-md-table-cell text-muted small">
                          {formatDateTime(w.updatedAt, i18n.language)}
                        </td>
                        <td className="text-end">
                          <Link to={`/workflows/${w.id}`} className="btn btn-sm btn-outline-secondary">
                            {t('common.edit')}
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
