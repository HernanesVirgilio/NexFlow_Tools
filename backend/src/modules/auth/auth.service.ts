import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { hashPassword, verifyPassword } from '../../utils/password';
import {
  generateOpaqueToken,
  hashToken,
  signAccessToken,
  ttlToMs,
} from '../../utils/jwt';
import { env } from '../../config/env';
import { passwordResetEmail, sendMail } from '../../utils/mailer';
import { logger } from '../../lib/logger';
import type { LoginInput, RegisterInput, SocialProvider } from './auth.schemas';

const REFRESH_TTL_MS = ttlToMs(env.JWT_REFRESH_TTL);
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function publicUser(
  u: { id: string; email: string; role: Role },
  profile: { name: string; avatarUrl: string | null; language: string; theme: string },
) {
  return { id: u.id, email: u.email, role: u.role, ...profile };
}

async function issueSession(user: { id: string; email: string; role: Role }) {
  const { token: refreshToken, hash } = generateOpaqueToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email, role: user.role }),
    refreshToken,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.conflict('An account with this email already exists');

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        profile: { create: { name: input.name } },
      },
      include: { profile: true },
    });

    const session = await issueSession(user);
    return { user: publicUser(user, user.profile!), ...session };
  },

  /**
   * Social sign-in (Google / GitHub / Facebook / X).
   *
   * FUTURE INTEGRATION — not implemented. When a provider's OAuth
   * credentials are configured, this is where the exchange lands:
   * verify the provider token/code, upsert the User + Profile, then
   * `issueSession(user)` exactly like password login. It deliberately
   * shares nothing with the password path beyond `issueSession`.
   * Until then it fails loudly rather than pretending to succeed.
   */
  async socialLogin(provider: SocialProvider): Promise<never> {
    logger.info('Social sign-in attempted but not configured', { provider });
    throw new AppError(
      501,
      'SOCIAL_AUTH_NOT_CONFIGURED',
      'Social sign-in is not available yet. Use your email and password.',
    );
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email }, include: { profile: true } });
    const ok = user && (await verifyPassword(user.passwordHash, input.password));
    if (!user || !ok) throw AppError.unauthorized('Invalid email or password');

    const session = await issueSession(user);
    return { user: publicUser(user, user.profile!), ...session };
  },

  async refresh(refreshToken: string) {
    const hash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Session expired, please sign in again');
    }

    // Rotate: revoke the used token, issue a fresh pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return issueSession(stored.user);
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    // Always return success to avoid leaking which emails are registered.
    if (!user) return;

    const { token, hash } = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });

    const link = `${env.APP_WEB_URL}/reset-password?token=${token}`;
    await sendMail(user.email, 'Reset your NexFlow Tools password', passwordResetEmail(user.profile?.name ?? 'there', link));
    logger.info('Password reset requested', { userId: user.id });
  },

  async resetPassword(token: string, password: string) {
    const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw AppError.badRequest('This reset link is invalid or has expired');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: stored.userId }, data: { passwordHash: await hashPassword(password) } }),
      prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
      // Invalidate every active session after a password change.
      prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
  },
};
