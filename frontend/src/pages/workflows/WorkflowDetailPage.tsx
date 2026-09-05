import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { workflowService } from '../../services/workflow.service';
import type { Workflow, WorkflowExecution } from '../../services/types';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { Field } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useErrorMessage } from '../../components/ui/ErrorState';
import { formatDateTime, formatDuration } from '../../utils/format';

export function WorkflowDetailPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();

  const wfState = useAsync<Workflow>(() => workflowService.get(id) as Promise<Workflow>, [id]);
  const execState = useAsync<WorkflowExecution[]>(() => workflowService.executions(id), [id]);

  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function guard(fn: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('workflows.edit')}
        actions={
          <button className="btn btn-outline-secondary" onClick={() => navigate('/workflows')}>
            {t('common.back')}
          </button>
        }
      />

      {notice && <div className={`alert alert-${notice.type} py-2`}>{notice.text}</div>}

      <AsyncBoundary state={wfState}>
        {(wf) => (
          <>
            <div className="nf-card nf-card--pad mb-4">
              <form
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  void guard(async () => {
                    const updated = await workflowService.update(wf.id, {
                      name: String(fd.get('name')),
                      description: String(fd.get('description') || ''),
                      engineRef: String(fd.get('engineRef') || ''),
                    });
                    wfState.setData(updated);
                    setNotice({ type: 'success', text: t('profile.saved') });
                  });
                }}
              >
                <Field label={t('common.name')} name="name" defaultValue={wf.name} required />
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    {t('common.description')}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows={3}
                    defaultValue={wf.description ?? ''}
                  />
                </div>
                <Field
                  label={t('workflows.engineRef')}
                  name="engineRef"
                  defaultValue={wf.engineRef ?? ''}
                  hint={t('workflows.engineRefHelp')}
                />
                <button type="submit" className="btn btn-nf-primary" disabled={busy}>
                  {t('common.save')}
                </button>
              </form>
            </div>

            <div className="nf-card nf-card--pad mb-4 d-flex flex-wrap gap-2 align-items-center">
              <span className={`nf-status ${wf.isActive ? 'nf-status--completed' : 'nf-status--pending'}`}>
                {wf.isActive ? t('workflows.active') : t('workflows.inactive')}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={busy}
                onClick={() =>
                  void guard(async () => {
                    const updated = await workflowService.update(wf.id, { isActive: !wf.isActive });
                    wfState.setData(updated);
                  })
                }
              >
                {wf.isActive ? t('workflows.deactivate') : t('workflows.activate')}
              </button>
              <button
                className="btn btn-sm btn-nf-primary"
                disabled={busy || !wf.isActive}
                onClick={() =>
                  void guard(async () => {
                    await workflowService.execute(wf.id);
                    setNotice({ type: 'success', text: t('workflows.runStarted') });
                    execState.reload();
                  })
                }
              >
                {t('workflows.run')}
              </button>
              <button
                className="btn btn-sm btn-outline-danger ms-auto"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                {t('common.delete')}
              </button>
            </div>

            <div className="nf-card">
              <div className="nf-card--pad pb-0">
                <h2 className="h6">{t('workflows.executionsTitle')}</h2>
              </div>
              <AsyncBoundary state={execState}>
                {(executions) =>
                  executions.length === 0 ? (
                    <EmptyState message={t('workflows.noExecutions')} />
                  ) : (
                    <div className="table-responsive nf-table-wrap">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>{t('common.status')}</th>
                            <th className="d-none d-sm-table-cell">{t('executions.startedAt')}</th>
                            <th className="d-none d-md-table-cell">{t('executions.duration')}</th>
                            <th>{t('executions.error')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {executions.map((ex) => (
                            <tr key={ex.id}>
                              <td><StatusBadge status={ex.status} /></td>
                              <td className="d-none d-sm-table-cell text-muted small">
                                {formatDateTime(ex.startedAt ?? ex.createdAt, i18n.language)}
                              </td>
                              <td className="d-none d-md-table-cell text-muted small">
                                {formatDuration(ex.durationMs)}
                              </td>
                              <td className="text-danger small">{ex.errorMessage ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </AsyncBoundary>
            </div>

            <ConfirmModal
              open={confirmDelete}
              title={t('common.delete')}
              message={t('workflows.deleteConfirm')}
              confirmLabel={t('common.delete')}
              danger
              busy={busy}
              onClose={() => setConfirmDelete(false)}
              onConfirm={() =>
                void guard(async () => {
                  await workflowService.remove(wf.id);
                  navigate('/workflows', { replace: true });
                })
              }
            />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
