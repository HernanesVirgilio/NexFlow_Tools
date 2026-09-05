import type { ReactNode } from 'react';

interface Props {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: Props) {
  return (
    <div className="nf-state">
      {title && <div className="nf-state__title">{title}</div>}
      <p className="mb-3">{message}</p>
      {action}
    </div>
  );
}
