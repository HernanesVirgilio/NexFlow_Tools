import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workflowService, type WorkflowCheckResult } from '../../services/workflow.service';
import type { WorkflowDefinition } from '../../services/types';
import { Icon } from '../ui/Icon';

interface Props {
  workflowId: string;
  definition: WorkflowDefinition;
  /** Bump to re-run the check (e.g. the builder's dirty counter). */
  revision: number;
}

/**
 * "Workflow check" — real validation state, surfaced as NexFlow Intelligence.
 * It calls the backend `/check` endpoint (same validateDefinition used on run),
 * so it never disagrees with what execution will do. No AI, no guesswork.
 */
export function WorkflowCheck({ workflowId, definition, revision }: Props) {
  const { t } = useTranslation();
  const [result, setResult] = useState<WorkflowCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const defRef = useRef(definition);
  defRef.current = definition;

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      setLoading(true);
      workflowService
        .check(workflowId, defRef.current)
        .then((r) => !cancelled && setResult(r))
        .catch(() => !cancelled && setResult(null))
        .finally(() => !cancelled && setLoading(false));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [workflowId, revision]);

  return (
    <section className="nf-check" aria-live="polite">
      <h2 className="nf-check__title">
        <Icon name="sparkles" size={14} />
        {t('builder.check.title')}
      </h2>
      {!result ? (
        <p className="nf-check__item">{loading ? t('common.loading') : '—'}</p>
      ) : result.ok ? (
        <p className="nf-check__item nf-check__item--ok">
          <Icon name="check" size={13} />
          {t('builder.check.ok')}
        </p>
      ) : (
        <ul className="nf-check__list">
          {result.issues.map((issue, i) => (
            <li key={i} className="nf-check__item nf-check__item--warn">
              <Icon name="alert" size={13} />
              {t(`builder.checkCodes.${issue.code}`, { defaultValue: issue.message })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
