import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';

export type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

interface Props {
  workflowId: string;
  name: string;
  onNameChange: (v: string) => void;
  isActive: boolean;
  saveState: SaveState;
  busy: boolean;
  onSave: () => void;
  onTest: () => void;
  onToggleActive: () => void;
  onLeave: (to: string) => void;
}

export function BuilderToolbar({
  workflowId,
  name,
  onNameChange,
  isActive,
  saveState,
  busy,
  onSave,
  onTest,
  onToggleActive,
  onLeave,
}: Props) {
  const { t } = useTranslation();

  return (
    <header className="nf-builder__toolbar">
      <div className="nf-builder__toolbar-left">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onLeave('/workflows')}>
          <Icon name="arrow-left" size={15} />
          {t('builder.back')}
        </button>
        <input
          className="form-control form-control-sm nf-builder__name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label={t('common.name')}
        />
        <span className={`nf-savestate nf-savestate--${saveState}`}>{t(`builder.save.${saveState}`)}</span>
      </div>

      <div className="nf-builder__toolbar-right">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onLeave(`/workflows/${workflowId}`)}
        >
          <Icon name="executions" size={15} />
          {t('builder.history')}
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onTest} disabled={busy}>
          <Icon name="play" size={14} />
          {t('builder.test')}
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onToggleActive} disabled={busy}>
          {isActive ? t('workflows.deactivate') : t('workflows.activate')}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-nf-primary"
          onClick={onSave}
          disabled={busy || saveState === 'saving' || saveState === 'saved' || saveState === 'idle'}
        >
          <Icon name="save" size={14} />
          {t('common.save')}
        </button>
      </div>
    </header>
  );
}
