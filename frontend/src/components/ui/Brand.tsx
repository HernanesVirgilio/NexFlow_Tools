import { useTranslation } from 'react-i18next';

export function Brand({ light = false }: { light?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={`nf-brand${light ? ' nf-brand--light' : ''}`}>
      <span className="nf-brand__dot" aria-hidden="true" />
      {t('brand')}
    </span>
  );
}
