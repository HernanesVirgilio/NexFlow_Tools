import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { IntegrationsPage } from '../pages/IntegrationsPage';
import { integrationsService } from '../services/integrations.service';

vi.mock('../services/integrations.service', () => ({
  integrationsService: { overview: vi.fn(), connectUrl: vi.fn(), disconnectGoogle: vi.fn() },
}));

function renderPage() {
  const ui: ReactElement = (
    <MemoryRouter>
      <ThemeProvider>
        <IntegrationsPage />
      </ThemeProvider>
    </MemoryRouter>
  );
  return render(ui);
}

describe('IntegrationsPage — real connections only', () => {
  beforeEach(() => {
    vi.mocked(integrationsService.overview).mockReset();
    vi.mocked(integrationsService.connectUrl).mockReset();
    vi.mocked(integrationsService.disconnectGoogle).mockReset();
  });

  it('never claims Google is connected when the backend is not configured', async () => {
    vi.mocked(integrationsService.overview).mockResolvedValue({
      configured: false,
      integrations: [{ provider: 'google', connected: false }],
    });
    renderPage();

    expect(await screen.findByText('Not configured on this server yet')).toBeInTheDocument();
    expect(screen.queryByText(/Connected as/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled();
  });

  it('offers a real connect action once the backend reports Google is configured', async () => {
    vi.mocked(integrationsService.overview).mockResolvedValue({
      configured: true,
      integrations: [{ provider: 'google', connected: false }],
    });
    vi.mocked(integrationsService.connectUrl).mockResolvedValue({ url: 'https://accounts.google.com/o/oauth2/v2/auth?x=1' });
    renderPage();

    const button = await screen.findByRole('button', { name: 'Connect' });
    expect(button).not.toBeDisabled();
    await userEvent.click(button);
    await waitFor(() => expect(integrationsService.connectUrl).toHaveBeenCalledTimes(1));
  });

  it('shows the real connected account and lets the user disconnect for real', async () => {
    vi.mocked(integrationsService.overview).mockResolvedValue({
      configured: true,
      integrations: [{ provider: 'google', connected: true, accountEmail: 'me@gmail.com' }],
    });
    vi.mocked(integrationsService.disconnectGoogle).mockResolvedValue(undefined);
    renderPage();

    expect(await screen.findByText('Connected as me@gmail.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await waitFor(() => expect(integrationsService.disconnectGoogle).toHaveBeenCalledTimes(1));
  });
});
