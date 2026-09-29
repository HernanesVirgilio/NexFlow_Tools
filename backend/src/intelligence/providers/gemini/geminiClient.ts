import { env } from '../../../config/env';
import { IntelligenceError } from '../../types';

/**
 * Thin fetch wrapper around the Gemini `generateContent` REST API.
 * Credentials live only here (server-side) — never sent to the frontend,
 * never logged. Mirrors automation/providers/n8n/n8nClient.ts.
 */
export async function geminiGenerateContent(body: Record<string, unknown>): Promise<unknown> {
  if (!env.GEMINI_API_KEY) {
    throw new IntelligenceError('Gemini API key is not configured', 'NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.GEMINI_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new IntelligenceError('Gemini request timed out', 'TIMEOUT', err);
    }
    throw new IntelligenceError('Gemini service is unreachable', 'UNAVAILABLE', err);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 || res.status === 403) {
    throw new IntelligenceError('Gemini rejected the API credentials', 'AUTH');
  }
  if (res.status === 429) {
    throw new IntelligenceError('Gemini rate limit exceeded', 'RATE_LIMITED');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new IntelligenceError(`Gemini error ${res.status}: ${text.slice(0, 300)}`, 'UNAVAILABLE');
  }

  return res.json();
}
