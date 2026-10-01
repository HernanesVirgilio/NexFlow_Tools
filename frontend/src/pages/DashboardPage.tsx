import { FormEvent, KeyboardEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboard.service';
import { workflowService } from '../services/workflow.service';
import { intelligenceService } from '../services/intelligence.service';
import { ApiError } from '../services/api';
import type { DashboardSummary, IntelligenceMode, IntelligenceResult, RecentWorkflow } from '../services/types';
import { AsyncBoundary } from '../components/ui/AsyncBoundary';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Icon, type IconName } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { ModeSelector } from '../components/intelligence/ModeSelector';
import { AnswerCard } from '../components/intelligence/AnswerCard';
import { WorkflowProposalCard } from '../components/intelligence/WorkflowProposalCard';
import { formatDateTime } from '../utils/format';

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

/** Known Intelligence error codes get a localized message; anything else falls back to the generic mapper. */
const INTELLIGENCE_ERROR_KEY: Record<string, string> = {
  INTELLIGENCE_NOT_CONFIGURED: 'intelligence.errors.notConfigured',
  INTELLIGENCE_MODE_NOT_IMPLEMENTED: 'intelligence.errors.notImplemented',
  INTELLIGENCE_AUTH: 'intelligence.errors.providerError',
  INTELLIGENCE_UNAVAILABLE: 'intelligence.errors.providerError',
  INTELLIGENCE_TIMEOUT: 'intelligence.errors.timeout',
  INTELLIGENCE_RATE_LIMITED: 'intelligence.errors.rateLimited',
  INTELLIGENCE_INVALID_RESPONSE: 'intelligence.errors.providerError',
  INTELLIGENCE_UNKNOWN: 'intelligence.errors.providerError',
  RATE_LIMITED: 'intelligence.errors.rateLimited',
  VALIDATION_ERROR: 'intelligence.errors.invalidInput',
};

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const state = useAsync(() => dashboardService.summary(), []);

  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<IntelligenceMode>('ask');
  const [busy, setBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName
    ? t(`dashboard.${greetingKey()}`, { name: firstName })
    : t('dashboard.greetingFallback');

  function toIntelMessage(err: unknown): string {
    if (err instanceof ApiError) {
      const key = INTELLIGENCE_ERROR_KEY[err.code];
      if (key) return t(key);
    }
    return toMessage(err);
  }

  async function sendToIntelligence() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setIntelError(null);
    setResult(null);
    try {
      const generated = await intelligenceService.generate(text, mode);
      setResult(generated);
    } catch (err) {
      setIntelError(toIntelMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onComposerSubmit(e: FormEvent) {
    e.preventDefault();
    void sendToIntelligence();
  }

  // Enter sends (matches most chat-style composers); Shift+Enter keeps the
  // textarea's native newline behaviour untouched.
  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendToIntelligence();
    }
  }

  async function confirmProposal() {
    if (result?.type !== 'workflow_proposal' || confirmBusy) return;
    setConfirmBusy(true);
    try {
      const wf = await workflowService.create({
        name: result.title,
        description: result.description,
        definition: result.definition,
      });
      navigate(`/workflows/${wf.id}/builder`);
    } catch (err) {
      setIntelError(toIntelMessage(err));
      setConfirmBusy(false);
    }
  }

  function discardResult() {
    setResult(null);
    setIntelError(null);
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

        <ModeSelector value={mode} onChange={setMode} />

        <form className="nf-composer" onSubmit={onComposerSubmit}>
          <label htmlFor="dash-intent" className="visually-hidden">
            {t(`intelligence.modes.${mode}`)}
          </label>
          <div className="nf-composer__row">
            <Icon name="sparkles" size={18} className="nf-composer__icon" />
            <textarea
              id="dash-intent"
              className="nf-composer__input"
              placeholder={t(`intelligence.placeholders.${mode}`)}
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onComposerKeyDown}
            />
            <button
              type="submit"
              className="nf-composer__send"
              disabled={!message.trim() || busy}
              aria-label={t('intelligence.submit')}
            >
              {busy ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <Icon name="send" size={16} />
              )}
            </button>
          </div>
          <div className="nf-composer__foot">
            <button
              type="button"
              className="nf-composer__example"
              onClick={() => setMessage(t(`intelligence.examples.${mode}`))}
            >
              {t('dashboard.tryExample')}
            </button>
            <span className="nf-dash__intel">{t('intelligence.poweredBy')}</span>
          </div>
        </form>
      </header>

      {intelError && (
        <div className="alert alert-danger py-2" role="alert">
          {intelError}
        </div>
      )}
      {result?.type === 'answer' && <AnswerCard content={result.content} onDiscard={discardResult} />}
      {result?.type === 'workflow_proposal' && (
        <WorkflowProposalCard
          proposal={result}
          busy={confirmBusy}
          onConfirm={() => void confirmProposal()}
          onDiscard={discardResult}
        />
      )}

      {notice && (
        <div className={`alert alert-${notice.type} py-2`} role="alert">
          {notice.text}
        </div>
      )}

      {/* ── Integrations — compact entry point to the real /integrations page ── */}
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
        <Link to="/integrations" className="btn btn-nf-primary btn-sm">
          <Icon name="plus" size={14} />
          {t('dashboard.connectToolsCta')}
        </Link>
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
