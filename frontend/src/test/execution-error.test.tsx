import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';
import { ExecutionError } from '../components/executions/ExecutionError';

describe('ExecutionError', () => {
  it('shows a supported recovery action for a known error code', async () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ExecutionError
        errorCode="AUTOMATION_TIMEOUT"
        errorMessage="The automation engine did not respond in time"
        workflowId="wf-1"
        executionId="ex-1"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('AUTOMATION_TIMEOUT')).toBeInTheDocument();
    expect(
      screen.getByText('The automation engine did not respond in time'),
    ).toBeInTheDocument();

    const retry = screen.getByRole('button', { name: /Retry/ });
    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalled();

    // timeout does not offer the builder action
    expect(screen.queryByRole('link', { name: /configuration/i })).not.toBeInTheDocument();
  });

  it('falls back to generic guidance for an unknown code without inventing detail', () => {
    renderWithProviders(
      <ExecutionError errorCode="SOMETHING_NEW" errorMessage={null} workflowId={null} />,
    );
    expect(screen.getByText('SOMETHING_NEW')).toBeInTheDocument();
    // no fabricated technical explanation line beyond the generic message
    expect(screen.queryByText(/token|secret|password/i)).not.toBeInTheDocument();
  });

  it('offers the builder action for an invalid-workflow error', () => {
    renderWithProviders(
      <ExecutionError
        errorCode="WORKFLOW_INVALID"
        errorMessage={null}
        workflowId="wf-2"
        compact
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/workflows/wf-2/builder');
  });
});
