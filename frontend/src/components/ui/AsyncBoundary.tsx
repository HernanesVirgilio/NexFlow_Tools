import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';

interface Props<T> {
  state: { data: T | null; loading: boolean; error: unknown; reload: () => void };
  children: (data: T) => ReactNode;
}

/** Standard loading / error / content switch for data-driven views. */
export function AsyncBoundary<T>({ state, children }: Props<T>) {
  if (state.loading && state.data == null) return <Spinner />;
  if (state.error && state.data == null) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data == null) return null;
  return <>{children(state.data)}</>;
}
