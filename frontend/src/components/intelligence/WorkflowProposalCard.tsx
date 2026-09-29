import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import type { WorkflowProposal } from '../../services/types';

/**
 * Review step for an AI-generated workflow. Nothing here is persisted or
 * executed — `onConfirm` is the only path to actually creating a workflow
 * (via the existing POST /workflows, same as the template catalogue), and
 * even then it's only ever created as an inactive draft the user opens in
 * the real builder. The AI never runs anything on its own.
 */
export function WorkflowProposalCard({
  proposal,
  busy,
  onConfirm,
  onDiscard,
}: {
  proposal: WorkflowProposal;
  busy: boolean;
  onConfirm: () => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const trigger = proposal.definition.nodes.find((n) =>
    ['manual', 'webhook'].includes(n.type),
  );

  return (
    <section className="nf-proposalcard" aria-label={t('intelligence.proposalTitle')}>
      <div className="nf-answercard__head">
        <span className="nf-answercard__badge">
          <Icon name="zap" size={13} />
          {t('intelligence.proposalTitle')}
        </span>
        {proposal.runnable ? (
          <span className="nf-status nf-status--completed">{t('intelligence.proposalReady')}</span>
        ) : (
          <span className="nf-status nf-status--pending">{t('intelligence.proposalNeedsWork')}</span>
        )}
      </div>

      <h3 className="nf-proposalcard__title">{proposal.title}</h3>
      {proposal.description && <p className="nf-proposalcard__desc">{proposal.description}</p>}

      <div className="nf-proposalcard__meta">
        <span>
          <Icon name="workflows" size={13} />
          {t('intelligence.proposalSteps', { count: proposal.definition.nodes.length })}
        </span>
        {trigger && (
          <span>
            <Icon name="zap" size={13} />
            {t(`intelligence.proposalTrigger.${trigger.type}`, { defaultValue: trigger.type })}
          </span>
        )}
      </div>

      {proposal.issues.length > 0 && (
        <ul className="nf-proposalcard__issues">
          {proposal.issues.map((issue, i) => (
            <li key={i}>
              <Icon name="alert" size={13} />
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <div className="nf-proposalcard__actions">
        <button type="button" className="btn btn-outline-secondary" onClick={onDiscard} disabled={busy}>
          {t('intelligence.discard')}
        </button>
        <button type="button" className="btn btn-nf-primary" onClick={onConfirm} disabled={busy}>
          {busy ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <Icon name="arrow-right" size={14} />
          )}
          {t('intelligence.proposalConfirm')}
        </button>
      </div>
    </section>
  );
}
