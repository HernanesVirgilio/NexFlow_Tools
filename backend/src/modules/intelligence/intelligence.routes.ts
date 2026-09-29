import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { intelligenceRateLimit } from '../../middleware/rateLimit';
import { ah } from '../../utils/asyncHandler';
import { intelligenceService } from '../../intelligence/IntelligenceService';
import { generateSchema } from './intelligence.schemas';

export const intelligenceRoutes = Router();
intelligenceRoutes.use(requireAuth);

intelligenceRoutes.post(
  '/generate',
  intelligenceRateLimit,
  validate({ body: generateSchema }),
  ah(async (req, res) => {
    res.json(await intelligenceService.generate(req.user!.id, req.body));
  }),
);
