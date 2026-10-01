import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { env } from '../../config/env';
import { integrationsService } from '../../integrations/IntegrationsService';
import { googleCallbackSchema } from './integrations.schemas';

export const integrationsRoutes = Router();

integrationsRoutes.get('/', requireAuth, ah(async (req, res) => {
  res.json({
    configured: integrationsService.configured(),
    integrations: await integrationsService.list(req.user!.id),
  });
}));

integrationsRoutes.get('/google/connect', requireAuth, ah(async (req, res) => {
  res.json({ url: integrationsService.connectUrl(req.user!.id) });
}));

// Google redirects the browser here directly — no Authorization header, no
// JSON response; `state` (see utils/jwt.ts signOAuthState) carries identity,
// and the user lands back in the app via a real redirect either way.
integrationsRoutes.get('/google/callback', ah(async (req, res) => {
  if (req.query.error) {
    return res.redirect(`${env.APP_WEB_URL}/integrations?status=denied`);
  }
  const parsed = googleCallbackSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.redirect(`${env.APP_WEB_URL}/integrations?status=error`);
  }
  try {
    await integrationsService.handleCallback(parsed.data.state, parsed.data.code);
    res.redirect(`${env.APP_WEB_URL}/integrations?status=connected`);
  } catch {
    res.redirect(`${env.APP_WEB_URL}/integrations?status=error`);
  }
}));

integrationsRoutes.delete('/google', requireAuth, ah(async (req, res) => {
  await integrationsService.disconnect(req.user!.id);
  res.status(204).end();
}));
