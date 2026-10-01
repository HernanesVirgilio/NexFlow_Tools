import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { DashboardPage } from '../pages/DashboardPage';
import { dashboardService } from '../services/dashboard.service';
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

function renderDashboard(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <MemoryRouter>
      <ThemeProvider>
        <DashboardPage />
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
    // Default mode is "ask" — the user is never forced into automation.
    expect(
      screen.getByPlaceholderText('Ask anything — how something works, what it means, how to learn it…'),
    ).toBeInTheDocument();
  });

  it('only shows real, implemented Intelligence modes — no "Em breve" entries', async () => {
    renderDashboard();
    expect(await screen.findByRole('radio', { name: 'Ask' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Think' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Code' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Automate' })).toBeInTheDocument();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('links to the real Integrations page instead of a fake catalogue', async () => {
    renderDashboard();
    const link = await screen.findByRole('link', { name: 'Connect tools' });
    expect(link).toHaveAttribute('href', '/integrations');
  });
});
