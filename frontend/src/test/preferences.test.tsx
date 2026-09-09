import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../i18n';
import { renderWithProviders } from './utils';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { ThemeToggle } from '../components/ui/ThemeToggle';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, setUser: vi.fn() }),
}));
vi.mock('../services/user.service', () => ({
  userService: { updateProfile: vi.fn().mockResolvedValue({}) },
}));

describe('preferences', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    document.documentElement.removeAttribute('data-nf-theme');
  });

  it('switches the interface language', async () => {
    renderWithProviders(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'PT' }));
    expect(i18n.language).toBe('pt');
  });

  it('cycles the theme and reflects it on the document', async () => {
    renderWithProviders(<ThemeToggle />);
    const btn = screen.getByRole('button', { name: /theme/i });

    await userEvent.click(btn); // system -> light
    expect(document.documentElement.getAttribute('data-nf-theme')).toBe('light');
    await userEvent.click(btn); // light -> dark
    expect(document.documentElement.getAttribute('data-nf-theme')).toBe('dark');
    expect(localStorage.getItem('nf_theme')).toBe('dark');
  });
});
