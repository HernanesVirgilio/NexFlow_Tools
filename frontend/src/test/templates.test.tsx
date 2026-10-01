import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';
import { TemplatesPage } from '../pages/TemplatesPage';
import { TEMPLATE_CATALOG } from '../data/templateCatalog';
import { workflowService } from '../services/workflow.service';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('../services/workflow.service', () => ({
  workflowService: { create: vi.fn() },
}));

describe('TemplatesPage', () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.mocked(workflowService.create).mockReset();
  });

  it('renders the catalog', () => {
    renderWithProviders(<TemplatesPage />);
    expect(screen.getByRole('heading', { name: 'Templates', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Lead notification')).toBeInTheDocument();
  });

  it('creates a real workflow from a template and opens the builder', async () => {
    vi.mocked(workflowService.create).mockResolvedValue({ id: 'wf-99' } as never);
    renderWithProviders(<TemplatesPage />);

    const buttons = screen.getAllByRole('button', { name: 'Use template' });
    await userEvent.click(buttons[0]);

    await waitFor(() => expect(workflowService.create).toHaveBeenCalledTimes(1));
    const arg = vi.mocked(workflowService.create).mock.calls[0][0];
    expect(arg.name).toBe('Lead notification');
    expect(arg.definition).toEqual(TEMPLATE_CATALOG[0].definition);
    expect(navigate).toHaveBeenCalledWith('/workflows/wf-99/builder');
  });

  it('every template in the catalogue is real — no "Coming soon" entries', () => {
    renderWithProviders(<TemplatesPage />);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
    const useButtons = screen.getAllByRole('button', { name: 'Use template' });
    expect(useButtons.length).toBe(TEMPLATE_CATALOG.length);
    useButtons.forEach((b) => expect(b).not.toBeDisabled());
  });

  it('filters templates by category', async () => {
    renderWithProviders(<TemplatesPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Sales' }));
    expect(screen.getByText('Lead notification')).toBeInTheDocument();
    expect(screen.queryByText('Request logger')).not.toBeInTheDocument();
  });
});
