import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  language: z.enum(['en', 'pt']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
