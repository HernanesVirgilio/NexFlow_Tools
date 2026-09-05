import { useTranslation } from 'react-i18next';

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center gap-2 text-muted py-4 justify-content-center">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{label ?? t('states.loading')}</span>
    </div>
  );
}
