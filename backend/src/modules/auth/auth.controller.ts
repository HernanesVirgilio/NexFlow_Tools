import { RequestHandler } from 'express';
import { env, isProd } from '../../config/env';
import { ttlToMs } from '../../utils/jwt';
import { authService } from './auth.service';

const REFRESH_COOKIE = 'nf_refresh';

const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: ttlToMs(env.JWT_REFRESH_TTL),
};

const setRefreshCookie = (res: Parameters<RequestHandler>[1], token: string) =>
  res.cookie(REFRESH_COOKIE, token, cookieOpts);

export const authController = {
  register: (async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  }) as RequestHandler,

  login: (async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  }) as RequestHandler,

  refresh: (async (req, res) => {
    const { accessToken, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  }) as RequestHandler,

  logout: (async (req, res) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(204).end();
  }) as RequestHandler,

  forgotPassword: (async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  }) as RequestHandler,

  resetPassword: (async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: 'Password updated. You can now sign in.' });
  }) as RequestHandler,
};
