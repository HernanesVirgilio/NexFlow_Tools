import { useTranslation } from 'react-i18next';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/admin.service';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Icon, type IconName } from '../../components/ui/Icon';
import type { AdminOverview } from '../../services/types';

const METRICS: { key: keyof AdminOverview['totals']; icon: IconName }[] = [
  { key: 'users', icon: 'profile' },
  { key: 'workflows', icon: 'workflows' },
  { key: 'activeWorkflows', icon: 'check' },
  { key: 'executions', icon: 'executions' },
];

/**
 * The first real (non-fake) Admin section — honest totals straight from the
 * database (see backend/src/modules/admin/admin.service.ts). No trends, no
 * costs, no anything the platform doesn't actually track yet.
 */
export function AdminOverviewPage() {
  const { t } = useTranslation();
  const state = useAsync(() => adminService.overview(), []);

  return (
    <div>
      <PageHeader title={t('admin.overview.title')} />
      <p className="text-muted mb-4">{t('admin.overview.subtitle')}</p>
      <AsyncBoundary state={state} skeleton={<OverviewSkeleton />}>
        {(data) => (
          <div className="nf-dash__stats">
            {METRICS.map((m) => (
              <div key={m.key} className="nf-stat">
                <div className="nf-stat__top">
                  <span className="nf-stat__label">{t(`admin.overview.${m.key}`)}</span>
                  <span className="nf-stat__icon">
                    <Icon name={m.icon} size={15} />
                  </span>
                </div>
                <div className="nf-stat__value">{data.totals[m.key]}</div>
              </div>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="nf-dash__stats" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="nf-stat">
          <Skeleton w="60%" h="0.7rem" />
          <Skeleton w="40%" h="1.6rem" className="mt-3" />
        </div>
      ))}
    </div>
  );
}
