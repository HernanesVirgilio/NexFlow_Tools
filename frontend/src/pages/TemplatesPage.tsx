import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { workflowService } from '../services/workflow.service';
import { TEMPLATE_CATALOG, templateStepCount, type WorkflowTemplate } from '../data/templateCatalog';
import { PageHeader } from '../components/ui/PageHeader';
import { Icon } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';

export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function useTemplate(tpl: WorkflowTemplate) {
    if (!tpl.definition || creatingId) return;
    setCreatingId(tpl.id);
    setError(null);
    try {
      const wf = await workflowService.create({
        name: t(`templates.items.${tpl.id}.title`),
        description: t(`templates.items.${tpl.id}.desc`),
        definition: tpl.definition,
      });
      navigate(`/workflows/${wf.id}/builder`);
    } catch (err) {
      setError(toMessage(err));
      setCreatingId(null);
    }
  }

  return (
    <div className="nf-templates">
      <PageHeader title={t('templates.title')} />
      <p className="nf-templates__lead">{t('templates.lead')}</p>
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="nf-templates__grid">
        {TEMPLATE_CATALOG.map((tpl) => {
          const soon = tpl.availability === 'coming-soon';
          return (
            <article key={tpl.id} className={`nf-tplcard${soon ? ' is-soon' : ''}`}>
              <div className="nf-tplcard__top">
                <span className="nf-tplcard__cat">{t(`templates.categories.${tpl.category}`)}</span>
                {soon && <span className="nf-badge">{t('dashboard.comingSoon')}</span>}
              </div>
              <h2 className="nf-tplcard__title">{t(`templates.items.${tpl.id}.title`)}</h2>
              <p className="nf-tplcard__desc">{t(`templates.items.${tpl.id}.desc`)}</p>
              <div className="nf-tplcard__meta">
                <span>
                  <Icon name="workflows" size={13} />
                  {t('templates.steps', { count: templateStepCount(tpl) })}
                </span>
                <span className="nf-tplcard__apps">{tpl.apps.join(' · ')}</span>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${soon ? 'btn-outline-secondary' : 'btn-nf-primary'}`}
                disabled={soon || creatingId === tpl.id}
                onClick={() => void useTemplate(tpl)}
              >
                {creatingId === tpl.id ? (
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                ) : soon ? (
                  t('dashboard.comingSoon')
                ) : (
                  t('templates.use')
                )}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
