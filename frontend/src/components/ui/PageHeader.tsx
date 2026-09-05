import type { ReactNode } from 'react';

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
      <h1 className="nf-page-title h3">{title}</h1>
      {actions && <div className="d-flex gap-2">{actions}</div>}
    </div>
  );
}
