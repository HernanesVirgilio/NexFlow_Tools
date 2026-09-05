import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

/** Social sign-in providers the UI offers. Backend integration is not wired yet. */
export const SOCIAL_PROVIDERS = ['google', 'github', 'facebook', 'twitter'] as const;
export const socialLoginParamsSchema = z.object({
  provider: z.enum(SOCIAL_PROVIDERS),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];
