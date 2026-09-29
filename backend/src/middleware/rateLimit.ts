import { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Minimal in-memory sliding-window rate limiter — single-process only,
 * matching the app's current single-instance deployment (same caveat as
 * the rest of the app). This is a basic abuse guard for cost-bearing
 * endpoints (AI calls), not a billing/quota system.
 */
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }): RequestHandler {
  const hits = new Map<string, number[]>();

  return (req, _res, next) => {
    const key = req.user?.id ?? req.ip ?? 'anonymous';
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      return next(new AppError(429, 'RATE_LIMITED', 'Too many requests — please try again shortly'));
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

/** 12 Intelligence requests per user per minute — generous for real use, tight enough to bound cost. */
export const intelligenceRateLimit = rateLimit({ windowMs: 60_000, max: 12 });
