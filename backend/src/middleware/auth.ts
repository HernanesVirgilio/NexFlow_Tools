import { RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: Role };
    }
  }
}

/** Requires a valid Bearer access token; attaches req.user (identity only — see requireRole for authorization). */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(AppError.unauthorized());
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};

/**
 * Authorization gate — run AFTER requireAuth. 403s when the authenticated
 * user's role isn't one of `roles`. The role travels inside the signed access
 * token (see utils/jwt.ts), so this never needs its own database round-trip.
 *
 *   router.use(requireAuth, requireRole(Role.ADMIN))
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have access to this resource'));
    }
    next();
  };
