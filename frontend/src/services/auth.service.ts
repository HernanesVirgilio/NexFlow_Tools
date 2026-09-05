import { api, tokenStore } from './api';
import type { CurrentUser } from './types';

interface AuthResponse {
  user: CurrentUser;
  accessToken: string;
}

export const SOCIAL_PROVIDERS = ['google', 'github', 'facebook', 'twitter'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const data = await api.post<AuthResponse>('/auth/register', input, { auth: false });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  async login(input: { email: string; password: string }) {
    const data = await api.post<AuthResponse>('/auth/login', input, { auth: false });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  async logout() {
    await api.post('/auth/logout', undefined, { auth: false }).catch(() => undefined);
    tokenStore.set(null);
  },

  /** Restore a session on app load using the httpOnly refresh cookie. */
  async restore(): Promise<CurrentUser | null> {
    const ok = await api.refresh();
    if (!ok) return null;
    return api.get<CurrentUser>('/users/me');
  },

  /**
   * Start social sign-in. The backend endpoint is reserved but not yet wired to
   * an OAuth provider, so this currently rejects with a 501 `ApiError`
   * (`SOCIAL_AUTH_NOT_CONFIGURED`). It never resolves to a fake session.
   * When OAuth is implemented this will redirect to / return the provider flow.
   */
  socialLogin: (provider: SocialProvider) =>
    api.post<AuthResponse>(`/auth/social/${provider}`, undefined, { auth: false }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }, { auth: false }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }, { auth: false }),
};
