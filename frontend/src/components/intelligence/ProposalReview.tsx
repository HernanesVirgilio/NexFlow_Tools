import { useTranslation } from 'react-i18next';
import type { IntelligenceProposal } from '../../services/intelligence.service';
import { Icon } from '../ui/Icon';

interface Props {
  proposal: IntelligenceProposal;
  confirming: boolean;
  error: string | null;
  onConfirm: () => void;
  onDiscard: () => void;
}

/** Review step: shows the proposal and its issues. Confirm saves; it never runs the workflow. */
export function ProposalReview({ proposal, confirming, error, onConfirm, onDiscard }: Props) {
  const { t } = useTranslation();
  const summary = proposal.summary || proposal.description;

  return (
    <section className="nf-card nf-card--pad nf-proposal" aria-labelledby="nf-proposal-title">
      <div className="nf-proposal__head">
        <span className="nf-proposal__icon" aria-hidden="true">
          <Icon name="sparkles" size={16} />
        </span>
        <div>
          <h2 id="nf-proposal-title" className="nf-proposal__title">
            {t('proposal.title')}
          </h2>
          <p className="nf-proposal__name">{proposal.name}</p>
        </div>
      </div>

      {summary && <p className="nf-proposal__summary">{summary}</p>}

      <h3 className="nf-proposal__label">{t('proposal.steps')}</h3>
      <ul className="nf-proposal__steps">
        {proposal.definition.nodes.map((node) => (
          <li key={node.id}>
            <span className="nf-proposal__step-type">{node.label || node.type}</span>
          </li>
        ))}
      </ul>

      <h3 className="nf-proposal__label">{t('proposal.issues')}</h3>
      {proposal.issues.length === 0 ? (
        <p className="nf-proposal__ok">{t('proposal.noIssues')}</p>
      ) : (
        <ul className="nf-proposal__issues">
          {proposal.issues.map((issue, index) => (
            <li key={`${issue.code}-${issue.nodeId ?? index}`}>{issue.message}</li>
          ))}
        </ul>
      )}

      {proposal.warnings.length > 0 && (
        <>
          <h3 className="nf-proposal__label">{t('proposal.warnings')}</h3>
          <ul className="nf-proposal__warnings">
            {proposal.warnings.map((warning, index) => (
              <li key={`${warning.code}-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </>
      )}

      <p className="nf-proposal__note">{t('proposal.inactiveNote')}</p>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="nf-proposal__actions">
        <button type="button" className="btn btn-nf-primary" onClick={onConfirm} disabled={confirming}>
          {confirming ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            t('proposal.confirm')
          )}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onDiscard} disabled={confirming}>
          {t('proposal.discard')}
        </button>
      </div>
    </section>
  );
}
