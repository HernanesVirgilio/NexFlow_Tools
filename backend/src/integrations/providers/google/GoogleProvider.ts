import { buildGoogleAuthUrl, exchangeGoogleCode, fetchGoogleEmail, isGoogleConfigured } from './googleClient';
import { IntegrationError, OAuthProvider, OAuthTokens } from '../../types';

/** First real OAuthProvider implementation. Nothing outside this folder should import a Google type. */
export class GoogleProvider implements OAuthProvider {
  readonly name = 'google' as const;

  get configured(): boolean {
    return isGoogleConfigured();
  }

  buildAuthUrl(state: string): string {
    if (!this.configured) {
      throw new IntegrationError('Google integration is not configured on this server', 'NOT_CONFIGURED');
    }
    return buildGoogleAuthUrl(state);
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const token = await exchangeGoogleCode(code);
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      scope: token.scope,
    };
  }

  async fetchAccountEmail(accessToken: string): Promise<string | undefined> {
    return fetchGoogleEmail(accessToken);
  }
}
