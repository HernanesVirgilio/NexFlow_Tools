import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';

/**
 * Splits on ``` fences so multi-line code the model returns (common for
 * `programming` mode) renders as a distinguishable block instead of one
 * run-on paragraph — without pulling in a markdown dependency.
 */
function splitSegments(content: string): { code: boolean; text: string }[] {
  const parts = content.split(/```(?:\w*\n)?/);
  return parts.map((text, i) => ({ code: i % 2 === 1, text: text.trim() })).filter((s) => s.text.length > 0);
}

export function AnswerCard({ content, onDiscard }: { content: string; onDiscard: () => void }) {
  const { t } = useTranslation();
  const segments = splitSegments(content);

  return (
    <section className="nf-answercard" aria-label={t('intelligence.answerTitle')}>
      <div className="nf-answercard__head">
        <span className="nf-answercard__badge">
          <Icon name="sparkles" size={13} />
          {t('intelligence.answerTitle')}
        </span>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onDiscard}>
          <Icon name="x" size={13} />
          {t('intelligence.discard')}
        </button>
      </div>
      <div className="nf-answercard__body">
        {segments.map((seg, i) =>
          seg.code ? (
            <pre key={i} className="nf-answercard__code">
              <code>{seg.text}</code>
            </pre>
          ) : (
            <p key={i} className="nf-answercard__text">
              {seg.text}
            </p>
          ),
        )}
      </div>
    </section>
  );
}
