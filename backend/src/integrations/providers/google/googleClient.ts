import { env } from '../../../config/env';
import { IntegrationError } from '../../types';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Read-only scopes only — NexFlow does not modify anything in a connected
// Google account. Matches what the product currently claims: the account
// connection itself is real; using it to actually read Gmail/Drive/Sheets
// data is not implemented yet (see docs/development.md "Still ahead").
export const GOOGLE_SCOPE =
  'openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';

export function isGoogleConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline', // required to receive a refresh_token
    prompt: 'consent', // forces a fresh refresh_token even on reconnect
    scope: GOOGLE_SCOPE,
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  error?: string;
  error_description?: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  let res: Response;
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
  } catch (err) {
    throw new IntegrationError('Google token endpoint is unreachable', 'UNAVAILABLE', err);
  }

  const data = (await res.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!res.ok || data.error) {
    throw new IntegrationError(data.error_description ?? `Google rejected the authorization (${res.status})`, 'AUTH');
  }
  return data;
}

export async function fetchGoogleEmail(accessToken: string): Promise<string | undefined> {
  const res = await fetch(USERINFO_ENDPOINT, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return undefined;
  const data = (await res.json().catch(() => ({}))) as { email?: string };
  return data.email;
}
