import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';

interface Props<T> {
  state: { data: T | null; loading: boolean; error: unknown; reload: () => void };
  children: (data: T) => ReactNode;
  /** Optional loading placeholder shown instead of the default spinner. */
  skeleton?: ReactNode;
}

/** Standard loading / error / content switch for data-driven views. */
export function AsyncBoundary<T>({ state, children, skeleton }: Props<T>) {
  if (state.loading && state.data == null) return <>{skeleton ?? <Spinner />}</>;
  if (state.error && state.data == null) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data == null) return null;
  return <>{children(state.data)}</>;
}
