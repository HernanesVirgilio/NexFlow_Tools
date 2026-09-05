import { api } from './api';
import type { CurrentUser } from './types';

export interface ProfileInput {
  name?: string;
  avatarUrl?: string | null;
  language?: 'en' | 'pt';
  theme?: 'light' | 'dark' | 'system';
}

export const userService = {
  me: () => api.get<CurrentUser>('/users/me'),
  updateProfile: (input: ProfileInput) => api.patch<CurrentUser>('/users/me', input),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/users/me/password', { currentPassword, newPassword }),
};
