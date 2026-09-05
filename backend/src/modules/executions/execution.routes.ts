import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { executionService } from './execution.service';

export const executionRoutes = Router();
executionRoutes.use(requireAuth);

executionRoutes.get(
  '/',
  validate({ query: z.object({ limit: z.coerce.number().min(1).max(200).optional() }) }),
  ah(async (req, res) => {
    res.json(await executionService.list(req.user!.id, Number(req.query.limit) || 50));
  }),
);

executionRoutes.get(
  '/:id',
  validate({ params: z.object({ id: z.string().cuid() }) }),
  ah(async (req, res) => {
    res.json(await executionService.get(req.params.id, req.user!.id));
  }),
);
