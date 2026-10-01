/**
 * Provider-agnostic Integrations contract.
 *
 *   NexFlow app  ->  IntegrationsService  ->  OAuthProvider (Google today, others later)
 *
 * Mirrors backend/src/automation/types.ts and backend/src/intelligence/types.ts
 * on purpose — same shape of problem (one internal facade, swappable external
 * providers). Nothing outside this folder should import a Google-specific type.
 */

export type IntegrationProviderName = 'google';

export interface IntegrationStatus {
  provider: IntegrationProviderName;
  connected: boolean;
  accountEmail?: string;
}

export interface OAuthTokens {
  accessToken: string;
  /** Google only returns this on first consent — see GoogleProvider. */
  refreshToken?: string;
  expiresIn: number;
  scope: string;
}

export interface OAuthProvider {
  readonly name: IntegrationProviderName;
  readonly configured: boolean;
  buildAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokens>;
  fetchAccountEmail(accessToken: string): Promise<string | undefined>;
}

export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly kind: 'NOT_CONFIGURED' | 'INVALID_STATE' | 'AUTH' | 'UNAVAILABLE' | 'UNKNOWN' = 'UNKNOWN',
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}
