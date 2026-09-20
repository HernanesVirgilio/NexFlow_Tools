import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { TOOL_CATALOG, TOOL_CATEGORIES, type ToolCategory } from '../../data/toolCatalog';

/**
 * "Conectar ferramentas" — a searchable catalogue in a modal, not a
 * permanent grid on the home screen. No tool here is actually connected:
 * there is no OAuth/integration backend yet, so every tile says so plainly.
 */
export function ConnectToolsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');

  if (!open) return null;

  const term = q.trim().toLowerCase();
  const tools = TOOL_CATALOG.filter((tool) => {
    if (category !== 'all' && tool.category !== category) return false;
    if (term && !t(`connectTools.items.${tool.id}`).toLowerCase().includes(term)) return false;
    return true;
  });

  return (
    <>
      <div className="modal-backdrop show" />
      <div
        className="modal d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nf-connect-title"
        onClick={onClose}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content nf-card nf-connect">
            <div className="nf-connect__head">
              <div>
                <h2 id="nf-connect-title" className="nf-connect__title">
                  {t('connectTools.title')}
                </h2>
                <p className="nf-connect__lead">{t('connectTools.lead')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose} />
            </div>

            <div className="nf-search nf-search--modal">
              <Icon name="search" size={15} />
              <input
                className="nf-search__input"
                placeholder={t('connectTools.searchPlaceholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t('connectTools.searchPlaceholder')}
              />
            </div>

            <div className="nf-templates__filters" role="group" aria-label={t('common.status')}>
              <button
                type="button"
                className={`nf-chip${category === 'all' ? ' is-active' : ''}`}
                onClick={() => setCategory('all')}
              >
                {t('templates.all')}
              </button>
              {TOOL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`nf-chip${category === c ? ' is-active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {t(`connectTools.categories.${c}`)}
                </button>
              ))}
            </div>

            {tools.length === 0 ? (
              <p className="nf-connect__empty">{t('connectTools.empty')}</p>
            ) : (
              <div className="nf-connect__grid">
                {tools.map((tool) => (
                  <div key={tool.id} className="nf-connect__tile" aria-disabled="true">
                    <span className="nf-connect__mark">{tool.mark}</span>
                    <span className="nf-connect__name">{t(`connectTools.items.${tool.id}`)}</span>
                    <span className="nf-connect__status">{t('connectTools.notConnected')}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="nf-connect__note">{t('connectTools.note')}</p>
          </div>
        </div>
      </div>
    </>
  );
}
