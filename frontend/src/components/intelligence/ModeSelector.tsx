import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../ui/Icon';
import type { IntelligenceMode } from '../../services/types';

interface ModeDef {
  key: IntelligenceMode;
  icon: IconName;
}

// Every mode here is wired to the real /api/intelligence/generate endpoint —
// no "Em breve" entries. A capability not yet backed by a real provider has
// no place in this list (see backend/src/intelligence/types.ts IMPLEMENTED_MODES).
const MODES: ModeDef[] = [
  { key: 'ask', icon: 'message' },
  { key: 'think', icon: 'branch' },
  { key: 'programming', icon: 'code' },
  { key: 'automation', icon: 'zap' },
];

/** Capability selector for the Intelligence composer. */
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
          onClick={() => onChange(m.key)}
        >
          <Icon name={m.icon} size={14} />
          {t(`intelligence.modes.${m.key}`)}
        </button>
      ))}
    </div>
  );
}
