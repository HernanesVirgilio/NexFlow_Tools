import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { workflowService } from '../services/workflow.service';
import type { DashboardSummary, RecentWorkflow } from '../services/types';
import { AsyncBoundary } from '../components/ui/AsyncBoundary';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Icon, type IconName } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';
import { formatDateTime } from '../utils/format';

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
          <span className="nf-dash__eyebrow">{t('dashboard.welcomeBack')}</span>
          <h1 className="nf-dash__greeting">
            {greeting} <span aria-hidden="true">👋</span>
          </h1>
          <p className="nf-dash__subtitle">
            {t('dashboard.subtitle')} {t('dashboard.buildToday')}
          </p>
        </div>

        <form className="nf-dash__intent" onSubmit={startFromIntent}>
          <div className="nf-dash__intent-top">
            <label htmlFor="dash-intent" className="nf-dash__intent-label">
              <Icon name="sparkles" size={15} />
              {t('dashboard.intentLabel')}
            </label>
            <span className="nf-dash__intel">
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
          <div className="nf-dash__intent-foot">
            <button
              type="button"
              className="btn btn-link btn-sm p-0 nf-dash__try"
              onClick={() => setIntent(t('dashboard.exampleText'))}
            >
              {t('dashboard.tryExample')}
            </button>
            <p className="nf-dash__intent-hint">{t('dashboard.intentHint')}</p>
          </div>
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
          <Link to="/templates" className="nf-quickstart__card">
            <Icon name="templates" />
            <span>{t('dashboard.useTemplate')}</span>
          </Link>
          <button type="button" className="nf-quickstart__card" disabled>
            <Icon name="sparkles" />
            <span>{t('dashboard.buildWithAi')}</span>
            <span className="nf-badge">{t('dashboard.comingSoon')}</span>
          </button>
          <button type="button" className="nf-quickstart__card" disabled>
            <Icon name="link" />
            <span>{t('dashboard.exploreIntegrations')}</span>
            <span className="nf-badge">{t('dashboard.comingSoon')}</span>
          </button>
        </div>
      </section>

      <AsyncBoundary state={state} skeleton={<DashboardSkeleton />}>
        {(data) => (
          <>
            <section className="nf-dash__stats" aria-label={t('dashboard.title')}>
              <Metric label={t('dashboard.totalWorkflows')} value={data.totals.workflows} icon="workflows" />
              <Metric label={t('dashboard.activeWorkflows')} value={data.totals.activeWorkflows} icon="check" />
              <Metric label={t('dashboard.totalExecutions')} value={data.totals.executions} icon="executions" />
              <Metric label={t('dashboard.runs7d')} value={data.totals.executions7d} icon="clock" />
            </section>

            <div className="nf-dash__grid">
              <section className="nf-card nf-card--pad">
                <div className="nf-dash__card-head">
                  <h2 className="nf-dash__section-title mt-0">{t('dashboard.recentWorkflows')}</h2>
                  <Link to="/workflows" className="nf-dash__see-all">
                    {t('common.actions')}
                    <Icon name="chevron-right" size={13} />
                  </Link>
                </div>
                {data.recentWorkflows.length === 0 ? (
                  <EmptyState
                    message={t('dashboard.empty')}
                    action={
                      <Link to="/workflows/new" className="btn btn-nf-primary">
                        {t('dashboard.createWorkflow')}
                      </Link>
                    }
                  />
                ) : (
                  <ul className="nf-wf-list">
                    {data.recentWorkflows.map((w) => (
                      <li key={w.id} className="nf-wf-row">
                        <div className="nf-wf-row__main">
                          <Link to={`/workflows/${w.id}`} className="nf-wf-row__name">
                            {w.name}
                          </Link>
                          {w.description && <p className="nf-wf-row__desc">{w.description}</p>}
                          <div className="nf-wf-row__meta">
                            <span
                              className={`nf-status ${w.isActive ? 'nf-status--completed' : 'nf-status--pending'}`}
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
                          <Link
                            to={`/workflows/${w.id}`}
                            className="btn btn-sm btn-outline-secondary nf-wf-row__more"
                            aria-label={t('dashboard.more')}
                          >
                            <Icon name="more" size={14} />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="nf-dash__col">
                <ExecutionOverview data={data} />
                <RecentActivity data={data} />
              </div>
            </div>

            <PopularIntegrations />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}

const ACTIVITY_ICON: Record<string, IconName> = {
  workflow_created: 'plus',
  execution_completed: 'check',
  execution_failed: 'alert',
  execution_started: 'play',
};

function RecentActivity({ data }: { data: DashboardSummary }) {
  const { t, i18n } = useTranslation();
  if (data.recentActivity.length === 0) return null;
  return (
    <section className="nf-card nf-card--pad">
      <h2 className="nf-dash__section-title mt-0">{t('dashboard.activityTitle')}</h2>
      <ul className="nf-actlist">
        {data.recentActivity.map((a, i) => (
          <li key={i} className={`nf-actlist__row nf-actlist__row--${a.type}`}>
            <span className="nf-actlist__icon">
              <Icon name={ACTIVITY_ICON[a.type] ?? 'info'} size={13} />
            </span>
            <span className="nf-actlist__text text-truncate">
              {t(`dashboard.activity.${a.type}`, { name: a.workflowName ?? '—' })}
            </span>
            <span className="text-muted small ms-auto">{formatDateTime(a.at, i18n.language)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const INTEGRATIONS = ['Google', 'Slack', 'Notion', 'GitHub', 'Microsoft', 'Airtable'];

function PopularIntegrations() {
  const { t } = useTranslation();
  return (
    <section className="nf-card nf-card--pad nf-integrations" aria-labelledby="dash-integrations">
      <div className="nf-dash__card-head">
        <h2 id="dash-integrations" className="nf-dash__section-title mt-0">
          {t('dashboard.integrations')}
        </h2>
        <span className="nf-badge">{t('dashboard.comingSoon')}</span>
      </div>
      <p className="nf-integrations__hint">{t('dashboard.integrationsHint')}</p>
      <div className="nf-integrations__grid">
        {INTEGRATIONS.map((name) => (
          <div key={name} className="nf-integrations__tile" aria-disabled="true">
            <span className="nf-integrations__mark">{name[0]}</span>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
        {t('dashboard.browseIntegrations')}
      </button>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <div className="nf-dash__stats mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="nf-stat">
            <Skeleton w="60%" h="0.7rem" />
            <Skeleton w="40%" h="1.6rem" className="mt-3" />
          </div>
        ))}
      </div>
      <div className="nf-dash__grid">
        <div className="nf-card nf-card--pad">
          <Skeleton w="30%" h="1rem" className="mb-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="d-flex align-items-center gap-3 py-3">
              <Skeleton w="55%" h="0.9rem" />
              <Skeleton w="4rem" h="1.4rem" pill className="ms-auto" />
            </div>
          ))}
        </div>
        <div className="nf-dash__col">
          <div className="nf-card nf-card--pad">
            <Skeleton w="40%" h="1rem" className="mb-3" />
            <Skeleton w="100%" h="3.5rem" />
          </div>
          <div className="nf-card nf-card--pad">
            <Skeleton w="40%" h="1rem" className="mb-3" />
            <Skeleton w="100%" h="2.5rem" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return (
    <div className="nf-stat">
      <div className="nf-stat__top">
        <span className="nf-stat__label">{label}</span>
        <span className="nf-stat__icon">
          <Icon name={icon} size={15} />
        </span>
      </div>
      <div className="nf-stat__value">{value}</div>
    </div>
  );
}

function ExecutionOverview({ data }: { data: DashboardSummary }) {
  const { t, i18n } = useTranslation();
  const w = data.executions7d;
  const success = w.COMPLETED ?? 0;
  const failed = w.FAILED ?? 0;
  const running = (w.RUNNING ?? 0) + (w.PENDING ?? 0);
  const total = success + failed + running;
  const finished = success + failed;
  const rate = finished > 0 ? Math.round((success / finished) * 100) : null;

  return (
    <section className="nf-card nf-card--pad">
      <h2 className="nf-dash__section-title mt-0">{t('dashboard.executionOverview')}</h2>
      <span className="nf-overview__period">{t('dashboard.last7days')}</span>

      {total === 0 && data.recentExecutions.length === 0 ? (
        <EmptyState message={t('dashboard.activityEmpty')} action={<span className="text-muted small">{t('dashboard.activityEmptyHint')}</span>} />
      ) : (
        <>
          {total === 0 ? (
            <p className="text-muted small mt-2 mb-3">{t('dashboard.noRuns7d')}</p>
          ) : (
            <div className="nf-overview__bars">
              <OverviewRow label={t('dashboard.successful')} count={success} total={total} tone="success" />
              <OverviewRow label={t('dashboard.failed')} count={failed} total={total} tone="error" />
              <OverviewRow label={t('dashboard.inProgress')} count={running} total={total} tone="info" />
              {rate !== null && <p className="nf-overview__rate">{t('dashboard.successRate', { rate })}</p>}
            </div>
          )}

          {data.recentExecutions.length > 0 && (
            <>
              <div className="nf-overview__sep" />
              <span className="nf-overview__period">{t('dashboard.latestRuns')}</span>
              <ul className="nf-activity">
                {data.recentExecutions.slice(0, 5).map((ex) => (
                  <li key={ex.id} className="nf-activity__row">
                    <StatusBadge status={ex.status} />
                    <span className="nf-activity__wf text-truncate">{ex.workflow?.name ?? '—'}</span>
                    <span className="text-muted small ms-auto">
                      {formatDateTime(ex.createdAt, i18n.language)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

function OverviewRow({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: 'success' | 'error' | 'info';
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="nf-overview__row">
      <span className="nf-overview__row-label">{label}</span>
      <span className="nf-overview__track">
        <span className={`nf-overview__fill nf-overview__fill--${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="nf-overview__row-count">{count}</span>
    </div>
  );
}
