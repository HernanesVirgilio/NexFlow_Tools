import { AppError } from '../utils/AppError';
import { logger } from '../lib/logger';
import { signOAuthState, verifyOAuthState } from '../utils/jwt';
import { encryptSecret } from '../utils/crypto';
import { prisma } from '../lib/prisma';
import { GoogleProvider } from './providers/google/GoogleProvider';
import { IntegrationError, IntegrationStatus, OAuthProvider } from './types';

/** Facade the rest of the app talks to — mirrors AutomationService/IntelligenceService. */
const provider: OAuthProvider = new GoogleProvider();

function toAppError(err: unknown): AppError {
  if (err instanceof IntegrationError) {
    const map: Record<IntegrationError['kind'], [number, string]> = {
      NOT_CONFIGURED: [501, 'Google integration is not configured on this server'],
      INVALID_STATE: [400, 'This connection link has expired or is invalid — please try connecting again'],
      AUTH: [502, 'Google rejected the connection request'],
      UNAVAILABLE: [502, 'Google is currently unavailable'],
      UNKNOWN: [502, 'Integration error'],
    };
    const [status, message] = map[err.kind];
    logger.warn('Integration provider error', { kind: err.kind, detail: err.message });
    return new AppError(status, `INTEGRATION_${err.kind}`, message);
  }
  logger.error('Unexpected integration failure', { err: String(err) });
  return AppError.upstream('Integration error');
}

export const integrationsService = {
  configured: () => provider.configured,

  async list(userId: string): Promise<IntegrationStatus[]> {
    const row = await prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
    });
    return [{ provider: 'google', connected: Boolean(row), accountEmail: row?.accountEmail ?? undefined }];
  },

  /** Step 1 — the real Google consent URL the frontend redirects the browser to. */
  connectUrl(userId: string): string {
    try {
      return provider.buildAuthUrl(signOAuthState(userId));
    } catch (err) {
      throw toAppError(err);
    }
  },

  /** Step 2 — Google's redirect back. No Authorization header exists here; `state` carries identity. */
  async handleCallback(state: string, code: string): Promise<void> {
    if (!provider.configured) {
      throw toAppError(new IntegrationError('Google integration is not configured on this server', 'NOT_CONFIGURED'));
    }

    let userId: string;
    try {
      userId = verifyOAuthState(state);
    } catch {
      throw toAppError(new IntegrationError('Invalid or expired state', 'INVALID_STATE'));
    }

    try {
      const tokens = await provider.exchangeCode(code);
      if (!tokens.refreshToken) {
        throw new IntegrationError(
          'Google did not return a refresh token — disconnect and reconnect to grant consent again',
          'AUTH',
        );
      }
      const accountEmail = await provider.fetchAccountEmail(tokens.accessToken);

      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider: 'GOOGLE' } },
        update: { accountEmail, scope: tokens.scope, encryptedRefreshToken: encryptSecret(tokens.refreshToken) },
        create: {
          userId,
          provider: 'GOOGLE',
          accountEmail,
          scope: tokens.scope,
          encryptedRefreshToken: encryptSecret(tokens.refreshToken),
        },
      });
      logger.info('Integration connected', { userId, provider: 'google' });
    } catch (err) {
      throw toAppError(err);
    }
  },

  async disconnect(userId: string): Promise<void> {
    await prisma.integration.deleteMany({ where: { userId, provider: 'GOOGLE' } });
    logger.info('Integration disconnected', { userId, provider: 'google' });
  },
};
