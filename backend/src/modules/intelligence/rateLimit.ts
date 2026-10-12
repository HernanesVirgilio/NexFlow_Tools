import { RequestHandler } from 'express';
import { AppError } from '../../utils/AppError';

interface Options {
  limit: number;
  windowMs: number;
  now?: () => number;
}

/** In-memory window keyed by authenticated user. Enough for a single API process. */
export function createRateLimiter({ limit, windowMs, now = Date.now }: Options): RequestHandler {
  const hits = new Map<string, number[]>();

  return (req, _res, next) => {
    const key = req.user?.id ?? 'anonymous';
    const at = now();
    const recent = (hits.get(key) ?? []).filter((stamp) => at - stamp < windowMs);
    if (recent.length >= limit) {
      return next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Wait a moment and try again.'));
    }
    recent.push(at);
    hits.set(key, recent);
    next();
  };
}
