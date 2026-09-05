import { api, tokenStore } from './api';
import type { CurrentUser } from './types';

interface AuthResponse {
  user: CurrentUser;
  accessToken: string;
}

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

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }, { auth: false }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }, { auth: false }),
};
