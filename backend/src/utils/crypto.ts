import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Reversible encryption for secrets we must use again later (OAuth refresh
 * tokens) — unlike `hashToken` in utils/jwt.ts, which is one-way and only
 * for values we merely need to *verify*, never read back.
 *
 * The key is derived from JWT_REFRESH_SECRET via SHA-256 rather than a new
 * required env var, so the app keeps booting with the existing `.env` (same
 * reasoning as GEMINI_API_KEY defaulting to empty). A production deployment
 * handling real user credentials should supply a dedicated secret/KMS key
 * instead — see docs/database.md.
 */
const KEY = crypto.createHash('sha256').update(`${env.JWT_REFRESH_SECRET}:integration-tokens`).digest();

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptSecret(encoded: string): string {
  const raw = Buffer.from(encoded, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
