import { useTranslation } from 'react-i18next';
import type { ExecutionStatus } from '../../services/types';

const cls: Record<ExecutionStatus, string> = {
  PENDING: 'nf-status nf-status--pending',
  RUNNING: 'nf-status nf-status--running',
  COMPLETED: 'nf-status nf-status--completed',
  FAILED: 'nf-status nf-status--failed',
};

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  const { t } = useTranslation();
  return <span className={cls[status]}>{t(`executions.${status}`)}</span>;
}
