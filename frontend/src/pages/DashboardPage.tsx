import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useConnectTools } from '../context/ConnectToolsContext';
import { dashboardService } from '../services/dashboard.service';
import { intelligenceService, type IntelligenceProposal } from '../services/intelligence.service';
import { workflowService } from '../services/workflow.service';
import { ProposalReview } from '../components/intelligence/ProposalReview';
import type { DashboardSummary, RecentWorkflow } from '../services/types';
import { AsyncBoundary } from '../components/ui/AsyncBoundary';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Icon, type IconName } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { formatDateTime } from '../utils/format';

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

type ComposerPhase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'review'; proposal: IntelligenceProposal };

const TASK_CARDS: { key: string; icon: IconName; to?: string }[] = [
  { key: 'text', icon: 'text' },
  { key: 'image', icon: 'image' },
  { key: 'video', icon: 'video' },
  { key: 'presentation', icon: 'presentation' },
  { key: 'analysis', icon: 'chart' },
  { key: 'automation', icon: 'zap', to: '/workflows/new' },
];

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const { openModal } = useConnectTools();
  const state = useAsync(() => dashboardService.summary(), []);

  const [intent, setIntent] = useState('');
  const [phase, setPhase] = useState<ComposerPhase>({ kind: 'idle' });
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? t(`dashboard.${greetingKey()}`, { name: firstName })
    : t('dashboard.greetingFallback');

  async function submitIntent(e?: FormEvent) {
    e?.preventDefault();
    const text = intent.trim();
    if (!text || phase.kind === 'loading' || confirming) return;
    setPhase({ kind: 'loading' });
    setConfirmError(null);
    setNotice(null);
    try {
      const result = await intelligenceService.generate(text);
      setPhase(result.status === 'empty' ? { kind: 'empty' } : { kind: 'review', proposal: result.proposal });
    } catch (err) {
      setPhase({ kind: 'error', message: toMessage(err) });
    }
  }

  async function confirmProposal() {
    if (phase.kind !== 'review' || confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const wf = await workflowService.create({
        name: phase.proposal.name,
        description: phase.proposal.description,
        definition: phase.proposal.definition,
      });
      navigate(`/workflows/${wf.id}/builder`);
    } catch (err) {
      setConfirmError(toMessage(err));
      setConfirming(false);
    }
  }

  function discardProposal() {
    setPhase({ kind: 'idle' });
    setConfirmError(null);
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
      <OnboardingModal />

      {/* ── Composer — the dominant element of the page ─────────────── */}
      <header className="nf-dash__hero">
        <span className="nf-dash__eyebrow">{greeting}</span>
        <h1 className="nf-dash__headline">{t('dashboard.buildToday')}</h1>
        <p className="nf-dash__lead">{t('dashboard.heroLead')}</p>

        <form className="nf-composer" onSubmit={(e) => void submitIntent(e)}>
          <label htmlFor="dash-intent" className="visually-hidden">
            {t('dashboard.intentLabel')}
          </label>
          <div className="nf-composer__row">
            <Icon name="sparkles" size={18} className="nf-composer__icon" />
            <textarea
              id="dash-intent"
              className="nf-composer__input"
              placeholder={t('dashboard.intentPlaceholder')}
              rows={2}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
            <button
              type="button"
              className="nf-composer__aux"
              disabled
              title={t('dashboard.comingSoon')}
              aria-label={t('dashboard.attachFile')}
            >
              <Icon name="paperclip" size={16} />
            </button>
            <button
              type="submit"
              className="nf-composer__send"
              disabled={!intent.trim() || phase.kind === 'loading' || confirming}
              aria-label={t('dashboard.intentSubmit')}
            >
              {phase.kind === 'loading' ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <Icon name="send" size={16} />
              )}
            </button>
          </div>
          <div className="nf-composer__foot">
            <button type="button" className="nf-composer__pill" disabled title={t('dashboard.comingSoon')}>
              <Icon name="paperclip" size={13} />
              {t('dashboard.attachFile')}
            </button>
            <button type="button" className="nf-composer__pill" disabled title={t('dashboard.comingSoon')}>
              <Icon name="globe" size={13} />
              {t('dashboard.searchWeb')}
            </button>
            <button type="button" className="nf-composer__pill" disabled title={t('dashboard.comingSoon')}>
              <Icon name="branch" size={13} />
              {t('dashboard.thinkMore')}
            </button>
            <button
              type="button"
              className="nf-composer__example"
              onClick={() => setIntent(t('dashboard.exampleText'))}
            >
              {t('dashboard.tryExample')}
            </button>
            <span className="nf-dash__intel">
              {t('dashboard.intelligence')} · {t('dashboard.intelligenceSoon')}
            </span>
          </div>
        </form>
      </header>

      <div aria-live="polite">
        {phase.kind === 'loading' && <p className="nf-proposal__status">{t('proposal.loading')}</p>}
        {phase.kind === 'error' && (
          <div className="alert alert-danger py-2 nf-proposal__status" role="alert">
            <span>{phase.message}</span>
            <button type="button" className="btn btn-outline-secondary btn-sm ms-2" onClick={() => void submitIntent()}>
              {t('states.retry')}
            </button>
          </div>
        )}
        {phase.kind === 'empty' && (
          <div className="alert alert-secondary py-2 nf-proposal__status" role="status">
            <span>{t('proposal.empty')}</span>
            <button type="button" className="btn btn-outline-secondary btn-sm ms-2" onClick={() => void submitIntent()}>
              {t('states.retry')}
            </button>
          </div>
        )}
        {phase.kind === 'review' && (
          <ProposalReview
            proposal={phase.proposal}
            confirming={confirming}
            error={confirmError}
            onConfirm={() => void confirmProposal()}
            onDiscard={discardProposal}
          />
        )}
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="alert">
          {notice.text}
        </div>
      )}

      {/* ── Task cards ───────────────────────────────────────────────── */}
      <section aria-labelledby="dash-tasks">
        <h2 id="dash-tasks" className="nf-dash__section-title">
          {t('dashboard.chooseTask')}
        </h2>
        <div className="nf-taskcards">
          {TASK_CARDS.map((card) =>
            card.to ? (
              <div key={card.key} className="nf-taskcard nf-taskcard--primary">
                <Link to={card.to} className="nf-taskcard__hit">
                  <span className="nf-taskcard__icon">
                    <Icon name={card.icon} size={20} />
                  </span>
                  <span className="nf-taskcard__title">{t(`dashboard.taskCards.${card.key}.title`)}</span>
                  <span className="nf-taskcard__desc">{t(`dashboard.taskCards.${card.key}.desc`)}</span>
                </Link>
                <Link to="/templates" className="nf-taskcard__alt">
                  {t('dashboard.orUseTemplate')}
                </Link>
              </div>
            ) : (
              <button key={card.key} type="button" className="nf-taskcard" disabled title={t('dashboard.comingSoon')}>
                <span className="nf-taskcard__icon">
                  <Icon name={card.icon} size={20} />
                </span>
                <span className="nf-taskcard__title">{t(`dashboard.taskCards.${card.key}.title`)}</span>
                <span className="nf-taskcard__desc">{t(`dashboard.taskCards.${card.key}.desc`)}</span>
                <span className="nf-badge">{t('dashboard.comingSoon')}</span>
              </button>
            ),
          )}
        </div>
      </section>

      {/* ── Connect tools — compact, opens a modal, never a permanent grid ── */}
      <section className="nf-card nf-card--pad nf-connectbar" aria-labelledby="dash-connect">
        <div className="nf-connectbar__icon">
          <Icon name="link" size={17} />
        </div>
        <div className="nf-connectbar__text">
          <h2 id="dash-connect" className="nf-connectbar__title">
            {t('dashboard.connectTools')}
          </h2>
          <p className="nf-connectbar__hint">{t('dashboard.connectToolsHint')}</p>
        </div>
        <button type="button" className="btn btn-nf-primary btn-sm" onClick={openModal}>
          <Icon name="plus" size={14} />
          {t('dashboard.connectToolsCta')}
        </button>
      </section>

      {/* ── Workspace overview — real data, secondary to the composer ──── */}
      <AsyncBoundary state={state} skeleton={<DashboardSkeleton />}>
        {(data) => (
          <section className="nf-dash__overview" aria-label={t('dashboard.title')}>
            <div className="nf-dash__stats">
              <Metric label={t('dashboard.totalWorkflows')} value={data.totals.workflows} icon="workflows" />
              <Metric label={t('dashboard.activeWorkflows')} value={data.totals.activeWorkflows} icon="check" />
              <Metric label={t('dashboard.totalExecutions')} value={data.totals.executions} icon="executions" />
              <Metric label={t('dashboard.runs7d')} value={data.totals.executions7d} icon="clock" />
            </div>

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
          </section>
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
