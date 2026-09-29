import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../ui/Icon';
import type { IntelligenceMode } from '../../services/types';

interface ModeDef {
  key: IntelligenceMode;
  icon: IconName;
  implemented: boolean;
}

/** Order matters for keyboard/tab flow — implemented modes first, "Em breve" ones last. */
const MODES: ModeDef[] = [
  { key: 'ask', icon: 'message', implemented: true },
  { key: 'think', icon: 'branch', implemented: true },
  { key: 'programming', icon: 'code', implemented: true },
  { key: 'automation', icon: 'zap', implemented: true },
  { key: 'analysis', icon: 'chart', implemented: false },
  { key: 'image', icon: 'image', implemented: false },
  { key: 'video', icon: 'video', implemented: false },
  { key: 'presentation', icon: 'presentation', implemented: false },
];

/**
 * Capability selector for the Intelligence composer. Only `ask` / `think` /
 * `programming` / `automation` are real today — the rest are disabled and
 * clearly labelled "Em breve", never silently swallowed as a real choice.
 */
export function ModeSelector({
  value,
  onChange,
}: {
  value: IntelligenceMode;
  onChange: (mode: IntelligenceMode) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="nf-modeselect" role="radiogroup" aria-label={t('intelligence.modeLabel')}>
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={value === m.key}
          className={`nf-modeselect__chip${value === m.key ? ' is-active' : ''}`}
          disabled={!m.implemented}
          title={m.implemented ? undefined : t('dashboard.comingSoon')}
          onClick={() => m.implemented && onChange(m.key)}
        >
          <Icon name={m.icon} size={14} />
          {t(`intelligence.modes.${m.key}`)}
          {!m.implemented && <span className="nf-badge nf-modeselect__badge">{t('dashboard.comingSoon')}</span>}
        </button>
      ))}
    </div>
  );
}
