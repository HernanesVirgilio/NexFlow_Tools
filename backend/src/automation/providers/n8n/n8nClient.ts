import { env } from '../../../config/env';
import { AutomationError } from '../../types';

/**
 * Thin fetch wrapper around the n8n public REST API.
 * Credentials live only here (server-side) — never sent to the frontend.
 */
export async function n8nRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!env.N8N_API_KEY) {
    throw new AutomationError('n8n API key is not configured', 'AUTH');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.N8N_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${env.N8N_BASE_URL}/api/v1${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': env.N8N_API_KEY,
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new AutomationError('n8n request timed out', 'TIMEOUT', err);
    }
    throw new AutomationError('n8n service is unreachable', 'UNAVAILABLE', err);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401 || res.status === 403) {
    throw new AutomationError('n8n rejected the API credentials', 'AUTH');
  }
  if (res.status === 404) {
    throw new AutomationError('n8n resource not found', 'NOT_FOUND');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AutomationError(`n8n error ${res.status}: ${body.slice(0, 300)}`, 'EXECUTION_ERROR');
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}
