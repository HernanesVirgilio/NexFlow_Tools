import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ConnectToolsProvider, useConnectTools } from '../context/ConnectToolsContext';
import { ConnectToolsModal } from '../components/layout/ConnectToolsModal';
import { DashboardPage } from '../pages/DashboardPage';
import { dashboardService } from '../services/dashboard.service';
import { workflowService } from '../services/workflow.service';
import type { DashboardSummary } from '../services/types';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Demo User', email: 'demo@nexflow.tools' } }),
}));

const { emptySummary } = vi.hoisted(() => ({
  emptySummary: {
    totals: { workflows: 0, activeWorkflows: 0, executions: 0, executions7d: 0 },
    executionsByStatus: {},
    executions7d: {},
    recentActivity: [],
    recentExecutions: [],
    recentWorkflows: [],
  } satisfies DashboardSummary,
}));

vi.mock('../services/dashboard.service', () => ({
  dashboardService: { summary: vi.fn().mockResolvedValue(emptySummary) },
}));
vi.mock('../services/workflow.service', () => ({
  workflowService: { create: vi.fn(), execute: vi.fn() },
}));

// Mirrors how AppLayout actually wires things: a single ConnectToolsModal
// instance shared via context, not one owned by DashboardPage itself.
function Harness() {
  const { open, closeModal } = useConnectTools();
  return (
    <>
      <DashboardPage />
      <ConnectToolsModal open={open} onClose={closeModal} />
    </>
  );
}

function renderDashboard(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <MemoryRouter>
      <ThemeProvider>
        <ConnectToolsProvider>
          <Harness />
        </ConnectToolsProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
  return render(ui);
}

describe('DashboardPage workspace restructure', () => {
  beforeEach(() => {
    localStorage.setItem('nf_onboarded', '1'); // keep the onboarding modal out of the way
    // setup.ts runs vi.restoreAllMocks() after every test — reapply the resolved value each time.
    vi.mocked(dashboardService.summary).mockResolvedValue(emptySummary);
  });

  it('makes the natural-language composer the dominant element', async () => {
    renderDashboard();
    expect(await screen.findByRole('heading', { name: 'What would you like to do today?' })).toBeInTheDocument();
    // Default mode is "Ask" — the composer opens general-purpose, not automation-only.
    expect(screen.getByPlaceholderText('Ask, create, analyze, code, or automate…')).toBeInTheDocument();
  });

  it('defaults to Ask mode and never fakes an AI response on submit', async () => {
    renderDashboard();
    const textbox = await screen.findByPlaceholderText('Ask, create, analyze, code, or automate…');
    await userEvent.type(textbox, 'Explain how event loops work');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ask is coming soon to NexFlow Intelligence');
    expect(workflowService.create).not.toHaveBeenCalled();
  });

  it('only executes a real capability when Automation mode is explicitly selected', async () => {
    vi.mocked(workflowService.create).mockResolvedValue({ id: 'wf-1' } as never);
    renderDashboard();

    await userEvent.click(screen.getByRole('button', { name: 'Automation' }));
    const textbox = await screen.findByPlaceholderText('When I receive a new lead, notify my team…');
    await userEvent.type(textbox, 'When a new lead arrives, notify sales');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(workflowService.create).toHaveBeenCalledTimes(1));
  });

  it('only the automation task card is a real capability — the rest are honestly disabled', async () => {
    renderDashboard();
    expect(await screen.findByRole('link', { name: /Automation/ })).toHaveAttribute('href', '/workflows/new');
    const soonButtons = screen.getAllByText('Coming soon');
    expect(soonButtons.length).toBeGreaterThanOrEqual(5); // text/image/video/presentation/analysis
  });

  it('opens the connect-tools catalogue from the compact bar, never as a permanent grid', async () => {
    renderDashboard();
    expect(screen.queryByText('Not connected yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Connect tools' }));
    expect(screen.getByText("Choose the tools you'd like to integrate with NexFlow.")).toBeInTheDocument();
    expect(screen.getAllByText('Not connected yet').length).toBeGreaterThan(0);
  });
});
