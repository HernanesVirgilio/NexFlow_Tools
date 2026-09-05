import { useTranslation } from 'react-i18next';

/** Dev-only marker. Renders nothing unless VITE_DEMO_MODE === 'true' at build time. */
export function DemoBanner() {
  const { t } = useTranslation();
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;

  return (
    <div className="alert alert-warning border-0 rounded-0 text-center py-1 mb-0 small" role="status">
      {t('demo.banner')}
    </div>
  );
}
