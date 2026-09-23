import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/users/user.routes';
import { workflowRoutes } from '../modules/workflows/workflow.routes';
import { executionRoutes } from '../modules/executions/execution.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { adminRoutes } from '../modules/admin/admin.routes';
import { automationService } from '../automation/AutomationService';
import { ah } from '../utils/asyncHandler';

export const apiRouter = Router();

apiRouter.get('/health', ah(async (_req, res) => {
  res.json({ status: 'ok', automation: { n8n: await automationService.health('n8n') } });
}));

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/workflows', workflowRoutes);
apiRouter.use('/executions', executionRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
// ADMIN-only — see modules/admin/admin.routes.ts. Never linked from the user workspace.
apiRouter.use('/admin', adminRoutes);
