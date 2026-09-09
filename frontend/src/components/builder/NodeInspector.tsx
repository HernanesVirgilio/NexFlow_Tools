import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import type { NfNode } from './useBuilderGraph';

interface Props {
  node: NfNode | null;
  onChange: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const CONDITION_OPS = ['equals', 'notEquals', 'contains', 'gt', 'lt', 'exists'];
const DELAY_UNITS = ['seconds', 'minutes', 'hours'];

export function NodeInspector({ node, onChange, onDelete }: Props) {
  const { t } = useTranslation();

  if (!node) {
    return (
      <aside className="nf-inspector" aria-label={t('builder.inspector')}>
        <p className="nf-inspector__hint">{t('builder.inspectorEmpty')}</p>
      </aside>
    );
  }

  const { nodeType, config, capability } = node.data;
  const set = (patch: Record<string, unknown>) => onChange(node.id, patch);
  const val = (k: string) => (config[k] === undefined ? '' : String(config[k]));

  const Text = ({ k, label }: { k: string; label: string }) => (
    <label className="nf-inspector__field">
      <span>{label}</span>
      <input className="form-control form-control-sm" value={val(k)} onChange={(e) => set({ [k]: e.target.value })} />
    </label>
  );

  const Select = ({ k, label, options }: { k: string; label: string; options: string[] }) => (
    <label className="nf-inspector__field">
      <span>{label}</span>
      <select className="form-select form-select-sm" value={val(k)} onChange={(e) => set({ [k]: e.target.value })}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <aside className="nf-inspector" aria-label={t('builder.inspector')}>
      <div className="nf-inspector__head">
        <h2 className="nf-inspector__title">{t(`builder.nodes.${nodeType}.title`)}</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => onDelete(node.id)}
          aria-label={t('common.delete')}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
      <p className="nf-inspector__desc">{t(`builder.nodes.${nodeType}.desc`)}</p>

      {capability === 'coming-soon' && (
        <div className="nf-inspector__soon">{t('builder.nodeComingSoon')}</div>
      )}

      {nodeType === 'manual' && <p className="nf-inspector__hint">{t('builder.noConfig')}</p>}

      {nodeType === 'webhook' && (
        <>
          <Select k="method" label={t('builder.fields.method')} options={HTTP_METHODS} />
          <Text k="path" label={t('builder.fields.path')} />
        </>
      )}

      {nodeType === 'http' && (
        <>
          <Select k="method" label={t('builder.fields.method')} options={HTTP_METHODS} />
          <Text k="url" label={t('builder.fields.url')} />
          <details className="nf-inspector__adv">
            <summary>{t('builder.advanced')}</summary>
            <Text k="headers" label={t('builder.fields.headers')} />
            <Text k="body" label={t('builder.fields.body')} />
          </details>
        </>
      )}

      {nodeType === 'transform' && <Text k="expression" label={t('builder.fields.expression')} />}

      {nodeType === 'delay' && (
        <>
          <label className="nf-inspector__field">
            <span>{t('builder.fields.duration')}</span>
            <input
              type="number"
              min={1}
              className="form-control form-control-sm"
              value={val('duration')}
              onChange={(e) => set({ duration: Number(e.target.value) })}
            />
          </label>
          <Select k="unit" label={t('builder.fields.unit')} options={DELAY_UNITS} />
        </>
      )}

      {nodeType === 'condition' && (
        <>
          <Text k="field" label={t('builder.fields.field')} />
          <Select k="operator" label={t('builder.fields.operator')} options={CONDITION_OPS} />
          <Text k="value" label={t('builder.fields.value')} />
        </>
      )}
    </aside>
  );
}
