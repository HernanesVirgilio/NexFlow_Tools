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
import { intelligenceService } from '../services/intelligence.service';
import { workflowService } from '../services/workflow.service';
import { ApiError } from '../services/api';
import type { DashboardSummary } from '../services/types';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

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
vi.mock('../services/intelligence.service', () => ({
  intelligenceService: { generate: vi.fn() },
}));
vi.mock('../services/workflow.service', () => ({
  workflowService: { create: vi.fn(), execute: vi.fn() },
}));

function Harness() {
  const { open, closeModal } = useConnectTools();
  return (
    <>
      <DashboardPage />
      <ConnectToolsModal open={open} onClose={closeModal} />
    </>
  );
}

function renderDashboard() {
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

describe('Intelligence composer', () => {
  beforeEach(() => {
    localStorage.setItem('nf_onboarded', '1');
    navigate.mockReset();
    vi.mocked(dashboardService.summary).mockResolvedValue(emptySummary);
    vi.mocked(intelligenceService.generate).mockReset();
    vi.mocked(workflowService.create).mockReset();
  });

  it('renders the mode selector with "Ask" active by default, and lets the user switch modes', async () => {
    renderDashboard();
    const ask = await screen.findByRole('radio', { name: /Ask/ });
    expect(ask).toHaveAttribute('aria-checked', 'true');

    const programming = screen.getByRole('radio', { name: /Code/ });
    expect(programming).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(programming);
    expect(programming).toHaveAttribute('aria-checked', 'true');
    expect(ask).toHaveAttribute('aria-checked', 'false');
  });

  it('never sends a request for a coming-soon capability — the chip stays disabled', async () => {
    renderDashboard();
    const imageChip = await screen.findByRole('radio', { name: /Image/ });
    expect(imageChip).toBeDisabled();
    await userEvent.click(imageChip);
    expect(imageChip).toHaveAttribute('aria-checked', 'false');
    expect(intelligenceService.generate).not.toHaveBeenCalled();
  });

  it('sends the typed message with the selected mode and shows a loading state', async () => {
    let resolveGenerate: (v: { type: 'answer'; content: string }) => void = () => {};
    vi.mocked(intelligenceService.generate).mockReturnValue(
      new Promise((resolve) => {
        resolveGenerate = resolve;
      }),
    );
    renderDashboard();

    const input = await screen.findByPlaceholderText(/Ask anything/);
    await userEvent.type(input, 'How does Docker work?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(intelligenceService.generate).toHaveBeenCalledWith('How does Docker work?', 'ask');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    resolveGenerate({ type: 'answer', content: 'Docker packages apps into containers.' });
    await waitFor(() => expect(screen.getByText('Docker packages apps into containers.')).toBeInTheDocument());
  });

  it('renders a conversational answer without creating any workflow', async () => {
    vi.mocked(intelligenceService.generate).mockResolvedValue({
      type: 'answer',
      content: 'Kubernetes orchestrates containers.',
    });
    renderDashboard();

    await userEvent.type(await screen.findByPlaceholderText(/Ask anything/), 'Explain Kubernetes');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Kubernetes orchestrates containers.')).toBeInTheDocument();
    expect(workflowService.create).not.toHaveBeenCalled();
  });

  it('renders a workflow proposal and only creates the workflow after explicit confirmation', async () => {
    vi.mocked(intelligenceService.generate).mockResolvedValue({
      type: 'workflow_proposal',
      title: 'Notify team of new leads',
      description: 'Webhook triggers a notification',
      definition: {
        version: 1,
        nodes: [
          { id: 'trigger', type: 'webhook', position: { x: 0, y: 0 }, config: { method: 'POST', path: 'new-lead' } },
          { id: 'notify', type: 'http', position: { x: 200, y: 0 }, config: { method: 'POST', url: 'https://example.com' } },
        ],
        edges: [{ id: 'e1', source: 'trigger', target: 'notify' }],
      },
      issues: [],
      runnable: true,
    });
    vi.mocked(workflowService.create).mockResolvedValue({ id: 'wf-1' } as never);
    renderDashboard();

    await userEvent.click(screen.getByRole('radio', { name: /Automate/ }));
    await userEvent.type(screen.getByPlaceholderText(/new lead/), 'Notify my team of new leads');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Notify team of new leads')).toBeInTheDocument();
    expect(workflowService.create).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Use this workflow' }));
    await waitFor(() => expect(workflowService.create).toHaveBeenCalledTimes(1));
    expect(workflowService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Notify team of new leads' }),
    );
    expect(navigate).toHaveBeenCalledWith('/workflows/wf-1/builder');
  });

  it('discarding a proposal never creates a workflow', async () => {
    vi.mocked(intelligenceService.generate).mockResolvedValue({
      type: 'workflow_proposal',
      title: 'x',
      description: '',
      definition: { version: 1, nodes: [], edges: [] },
      issues: [],
      runnable: false,
    });
    renderDashboard();

    await userEvent.click(screen.getByRole('radio', { name: /Automate/ }));
    await userEvent.type(screen.getByPlaceholderText(/new lead/), 'do something');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await screen.findByText('Discard');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.queryByText('Discard')).not.toBeInTheDocument();
    expect(workflowService.create).not.toHaveBeenCalled();
  });

  it('shows an honest, localized message when the provider is not configured', async () => {
    vi.mocked(intelligenceService.generate).mockRejectedValue(
      new ApiError(501, 'INTELLIGENCE_NOT_CONFIGURED', "NexFlow Intelligence is not configured yet"),
    );
    renderDashboard();

    await userEvent.type(await screen.findByPlaceholderText(/Ask anything/), 'hi');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText("NexFlow Intelligence isn't configured on this server yet.")).toBeInTheDocument();
  });
});
