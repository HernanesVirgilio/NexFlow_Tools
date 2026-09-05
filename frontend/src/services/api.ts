/**
 * Single HTTP client for the whole frontend. Handles:
 *  - base URL + JSON
 *  - in-memory access token + cookie-based refresh token
 *  - one automatic retry after a 401 by refreshing the session
 * No component should call fetch() directly.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let onAuthLost: (() => void) | null = null;

export const tokenStore = {
  set: (t: string | null) => {
    accessToken = t;
  },
  get: () => accessToken,
  onAuthLost: (cb: () => void) => {
    onAuthLost = cb;
  },
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean; // default true
  _retry?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, auth = true, _retry, headers, ...rest } = opts;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'network');
  }

  if (res.status === 401 && auth && !_retry && path !== '/auth/refresh') {
    // Try to refresh once, then replay the original request.
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, { ...opts, _retry: true });
    onAuthLost?.();
    throw new ApiError(401, 'UNAUTHORIZED', 'unauthorized');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } }).error;
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? 'generic', err?.details);
  }
  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const data = await request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      auth: false,
      _retry: true,
    });
    accessToken = data.accessToken;
    return true;
  } catch {
    accessToken = null;
    return false;
  }
}

export const api = {
  get: <T>(p: string, o?: RequestOptions) => request<T>(p, { ...o, method: 'GET' }),
  post: <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>(p, { ...o, method: 'POST', body }),
  patch: <T>(p: string, body?: unknown, o?: RequestOptions) => request<T>(p, { ...o, method: 'PATCH', body }),
  del: <T>(p: string, o?: RequestOptions) => request<T>(p, { ...o, method: 'DELETE' }),
  refresh: tryRefresh,
};
