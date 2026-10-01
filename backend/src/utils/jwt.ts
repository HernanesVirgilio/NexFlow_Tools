import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * OAuth `state` tokens. A provider redirect (e.g. Google's callback) lands on
 * the browser with no Authorization header, so the signed state is what proves
 * *which* user started the flow (and that it wasn't forged) — the standard
 * CSRF-protection role `state` plays in OAuth2, reusing the existing JWT
 * infra instead of inventing a second token format.
 */
export function signOAuthState(userId: string): string {
  return jwt.sign({ uid: userId, purpose: 'oauth_state' }, env.JWT_ACCESS_SECRET, { expiresIn: '10m' });
}

export function verifyOAuthState(state: string): string {
  const payload = jwt.verify(state, env.JWT_ACCESS_SECRET) as { uid?: string; purpose?: string };
  if (payload.purpose !== 'oauth_state' || !payload.uid) {
    throw new Error('Invalid OAuth state');
  }
  return payload.uid;
}

/**
 * Refresh tokens are opaque random strings. We store only their SHA-256 hash,
 * so a database leak does not expose usable tokens.
 */
export function generateOpaqueToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('hex');
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

/** Parse strings like "15m", "7d", "3600s" into milliseconds. */
export function ttlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!m) return Number(ttl) || 0;
  const n = Number(m[1]);
  return n * { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as 's' | 'm' | 'h' | 'd'];
}
