import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth';
import { ah } from '../../utils/asyncHandler';
import { adminService } from './admin.service';

export const adminRoutes = Router();

// Authentication (who are you) then authorization (are you allowed here) —
// every route below requires both. See middleware/auth.ts.
adminRoutes.use(requireAuth, requireRole(Role.ADMIN));

adminRoutes.get('/overview', ah(async (_req, res) => {
  res.json(await adminService.overview());
}));
