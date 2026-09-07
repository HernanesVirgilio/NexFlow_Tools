import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './utils';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

describe('OnboardingModal', () => {
  it('shows on first run and hides once dismissed', async () => {
    renderWithProviders(<OnboardingModal />);
    expect(screen.getByText('Welcome to NexFlow')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Skip for now' })[0]);

    expect(screen.queryByText('Welcome to NexFlow')).not.toBeInTheDocument();
    expect(localStorage.getItem('nf_onboarded')).toBe('1');
  });

  it('does not show when already onboarded', () => {
    localStorage.setItem('nf_onboarded', '1');
    renderWithProviders(<OnboardingModal />);
    expect(screen.queryByText('Welcome to NexFlow')).not.toBeInTheDocument();
  });

  it('reaches step 2 and routes into the real builder', async () => {
    renderWithProviders(<OnboardingModal />);
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText('Create your first workflow')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Start from scratch/ }));
    expect(navigate).toHaveBeenCalledWith('/workflows/new');
  });
});
