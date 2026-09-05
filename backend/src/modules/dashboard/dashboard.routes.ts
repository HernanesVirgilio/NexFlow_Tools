import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { ah } from '../../utils/asyncHandler';
import { dashboardService } from './dashboard.service';

export const dashboardRoutes = Router();
dashboardRoutes.use(requireAuth);

dashboardRoutes.get('/summary', ah(async (req, res) => {
  res.json(await dashboardService.summary(req.user!.id));
}));
