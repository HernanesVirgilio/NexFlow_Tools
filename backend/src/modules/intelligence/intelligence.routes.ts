import { Router } from 'express';
import { env } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { intelligenceService } from './intelligence.service';
import { generateBodySchema } from './intelligence.schemas';
import { createRateLimiter } from './rateLimit';

const limitGenerate = createRateLimiter({
  limit: env.INTELLIGENCE_RATE_LIMIT,
  windowMs: 60_000,
});

export const intelligenceRoutes = Router();
intelligenceRoutes.use(requireAuth);

intelligenceRoutes.post(
  '/generate',
  validate({ body: generateBodySchema }),
  limitGenerate,
  ah(async (req, res) => {
    const result = await intelligenceService.generate(req.body.prompt);
    res.json(result);
  }),
);
