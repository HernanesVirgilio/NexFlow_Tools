import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { workflowService } from '../../services/workflow.service';
import type { Workflow } from '../../services/types';
import { Icon } from '../ui/Icon';

/**
 * Workspace search over the signed-in user's own workflows. Real client-side
 * filter — the list is fetched once on first focus. ⌘K / Ctrl+K focuses it.
 */
export function WorkspaceSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Workflow[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function ensureLoaded() {
    if (items === null) {
      try {
        setItems(await workflowService.list());
      } catch {
        setItems([]);
      }
    }
  }

  const term = q.trim().toLowerCase();
  const results =
    term && items
      ? items
          .filter((w) => w.name.toLowerCase().includes(term) || (w.description ?? '').toLowerCase().includes(term))
          .slice(0, 6)
      : [];

  return (
    <div className="nf-search" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <Icon name="search" size={15} />
      <input
        ref={inputRef}
        type="search"
        className="nf-search__input"
        placeholder={t('search.placeholder')}
        value={q}
        onFocus={() => {
          setOpen(true);
          void ensureLoaded();
        }}
        onChange={(e) => setQ(e.target.value)}
        aria-label={t('search.placeholder')}
      />
      <kbd className="nf-search__kbd">⌘K</kbd>
      {open && term.length > 0 && (
        <ul className="nf-search__results" role="listbox">
          {results.length === 0 ? (
            <li className="nf-search__empty">{t('search.noResults')}</li>
          ) : (
            results.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="nf-search__result"
                  onClick={() => {
                    setOpen(false);
                    setQ('');
                    navigate(`/workflows/${w.id}`);
                  }}
                >
                  <Icon name="workflows" size={14} />
                  <span className="text-truncate">{w.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
