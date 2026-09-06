import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { workflowService } from '../services/workflow.service';
import type { RecentWorkflow } from '../services/types';
import { AsyncBoundary } from '../components/ui/AsyncBoundary';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Icon } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';
import { formatDateTime, formatDuration } from '../utils/format';

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const state = useAsync(() => dashboardService.summary(), []);

  const [intent, setIntent] = useState('');
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? t(`dashboard.${greetingKey()}`, { name: firstName })
    : t('dashboard.greetingFallback');

  async function startFromIntent(e: FormEvent) {
    e.preventDefault();
    const text = intent.trim();
    if (!text || creating) return;
    setCreating(true);
    setNotice(null);
    try {
      const wf = await workflowService.create({
        name: text.length > 60 ? `${text.slice(0, 57)}…` : text,
        description: text,
      });
      navigate(`/workflows/${wf.id}/builder`);
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
      setCreating(false);
    }
  }

  async function run(w: RecentWorkflow) {
    setRunningId(w.id);
    setNotice(null);
    try {
      await workflowService.execute(w.id);
      setNotice({ type: 'success', text: t('workflows.runStarted') });
      state.reload();
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="nf-dash">
      <header className="nf-dash__hero">
        <div className="nf-dash__hero-head">
          <h1 className="nf-dash__greeting">
            {greeting} <span aria-hidden="true">👋</span>
          </h1>
          <p className="nf-dash__subtitle">{t('dashboard.subtitle')}</p>
        </div>

        <form className="nf-dash__intent" onSubmit={startFromIntent}>
          <div className="nf-dash__intent-top">
            <label htmlFor="dash-intent" className="nf-dash__intent-label">
              {t('dashboard.intentLabel')}
            </label>
            <span className="nf-dash__intel">
              <Icon name="sparkles" size={13} />
              {t('dashboard.intelligence')} · {t('dashboard.intelligenceSoon')}
            </span>
          </div>
          <div className="nf-dash__intent-row">
            <input
              id="dash-intent"
              className="form-control"
              placeholder={t('dashboard.intentPlaceholder')}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
            <button type="submit" className="btn btn-nf-primary" disabled={!intent.trim() || creating}>
              {creating ? t('common.loading') : t('dashboard.intentSubmit')}
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
          <p className="nf-dash__intent-hint">{t('dashboard.intentHint')}</p>
        </form>
      </header>

      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="alert">
          {notice.text}
        </div>
      )}

      <section aria-labelledby="dash-quickstart">
        <h2 id="dash-quickstart" className="nf-dash__section-title">
          {t('dashboard.quickStart')}
        </h2>
        <div className="nf-quickstart">
          <Link to="/workflows/new" className="nf-quickstart__card nf-quickstart__card--primary">
            <Icon name="plus" />
            <span>{t('dashboard.createWorkflow')}</span>
          </Link>
          <button type="button" className="nf-quickstart__card" disabled>
            <Icon name="templates" />
            <span>{t('dashboard.useTemplate')}</span>
            <span className="nf-badge">{t('dashboard.comingSoon')}</span>
          </button>
          <button type="button" className="nf-quickstart__card" disabled>
            <Icon name="sparkles" />
            <span>{t('dashboard.buildWithAi')}</span>
            <span className="nf-badge">{t('dashboard.comingSoon')}</span>
          </button>
        </div>
      </section>

      <AsyncBoundary state={state}>
        {(data) => (
          <>
            <section className="nf-dash__stats" aria-label={t('dashboard.title')}>
              <div className="nf-stat">
                <div className="nf-stat__label">{t('dashboard.totalWorkflows')}</div>
                <div className="nf-stat__value">{data.totals.workflows}</div>
              </div>
              <div className="nf-stat">
                <div className="nf-stat__label">{t('dashboard.activeWorkflows')}</div>
                <div className="nf-stat__value">{data.totals.activeWorkflows}</div>
              </div>
              <div className="nf-stat">
                <div className="nf-stat__label">{t('dashboard.totalExecutions')}</div>
                <div className="nf-stat__value">{data.totals.executions}</div>
              </div>
            </section>

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
              <div className="nf-dash__grid">
                <section className="nf-card nf-card--pad">
                  <h2 className="nf-dash__section-title mt-0">{t('dashboard.recentWorkflows')}</h2>
                  <ul className="nf-wf-list">
                    {data.recentWorkflows.map((w) => (
                      <li key={w.id} className="nf-wf-row">
                        <div className="nf-wf-row__main">
                          <Link to={`/workflows/${w.id}`} className="nf-wf-row__name">
                            {w.name}
                          </Link>
                          <div className="nf-wf-row__meta">
                            <span
                              className={`nf-status ${
                                w.isActive ? 'nf-status--completed' : 'nf-status--pending'
                              }`}
                            >
                              {w.isActive ? t('workflows.active') : t('workflows.inactive')}
                            </span>
                            <span className="text-muted small">
                              {t('dashboard.executionCount', { count: w._count?.executions ?? 0 })}
                            </span>
                            <span className="text-muted small d-none d-sm-inline">
                              {w.lastExecution
                                ? t('dashboard.lastRun', {
                                    when: formatDateTime(w.lastExecution.createdAt, i18n.language),
                                  })
                                : t('dashboard.neverRun')}
                            </span>
                          </div>
                        </div>
                        <div className="nf-wf-row__actions">
                          <Link to={`/workflows/${w.id}`} className="btn btn-sm btn-outline-secondary">
                            {t('dashboard.open')}
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-nf-primary"
                            disabled={!w.isActive || runningId === w.id}
                            onClick={() => void run(w)}
                          >
                            {runningId === w.id ? (
                              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                            ) : (
                              <>
                                <Icon name="play" size={14} />
                                {t('workflows.run')}
                              </>
                            )}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="nf-card nf-card--pad">
                  <h2 className="nf-dash__section-title mt-0">{t('dashboard.recentExecutions')}</h2>
                  {data.recentExecutions.length === 0 ? (
                    <EmptyState
                      message={t('dashboard.activityEmpty')}
                      action={<span className="text-muted small">{t('dashboard.activityEmptyHint')}</span>}
                    />
                  ) : (
                    <ul className="nf-activity">
                      {data.recentExecutions.map((ex) => (
                        <li key={ex.id} className="nf-activity__row">
                          <StatusBadge status={ex.status} />
                          <span className="nf-activity__wf text-truncate">
                            {ex.workflow?.name ?? '—'}
                          </span>
                          <span className="text-muted small ms-auto d-none d-sm-inline">
                            {formatDuration(ex.durationMs)}
                          </span>
                          <span className="text-muted small">
                            {formatDateTime(ex.createdAt, i18n.language)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
