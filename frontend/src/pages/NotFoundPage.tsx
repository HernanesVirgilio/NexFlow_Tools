import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="nf-card nf-card--pad m-4">
      <EmptyState
        title="404"
        message={t('errors.generic')}
        action={
          <Link to="/" className="btn btn-nf-primary">
            {t('nav.dashboard')}
          </Link>
        }
      />
    </div>
  );
}
