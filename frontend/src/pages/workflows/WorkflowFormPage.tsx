import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { workflowService } from '../../services/workflow.service';
import { Field } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { useErrorMessage } from '../../components/ui/ErrorState';

export function WorkflowFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toMessage = useErrorMessage();

  const [form, setForm] = useState({ name: '', description: '', engineRef: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const wf = await workflowService.create({
        name: form.name,
        description: form.description || undefined,
        engineRef: form.engineRef || undefined,
      });
      navigate(`/workflows/${wf.id}`, { replace: true });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('workflows.new')} />
      <div className="nf-card nf-card--pad">
        <form onSubmit={onSubmit} noValidate>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <Field label={t('common.name')} name="name" required value={form.name} onChange={set('name')} />
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              {t('common.description')}
            </label>
            <textarea
              id="description"
              className="form-control"
              rows={3}
              value={form.description}
              onChange={set('description')}
            />
          </div>
          <Field
            label={t('workflows.engineRef')}
            name="engineRef"
            value={form.engineRef}
            onChange={set('engineRef')}
            hint={t('workflows.engineRefHelp')}
          />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-nf-primary" disabled={busy}>
              {busy ? t('common.loading') : t('common.create')}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/workflows')}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
