import { prisma } from '../../lib/prisma';

/**
 * ERN-04 — first real (non-fake) administrative capability: honest totals
 * straight from the database. No fabricated metrics, no trends, no costs —
 * those need real data sources (billing, provider usage) that don't exist
 * yet. Extend this only with counts/queries the platform actually has.
 */
export const adminService = {
  async overview() {
    const [users, workflows, activeWorkflows, executions] = await Promise.all([
      prisma.user.count(),
      prisma.workflow.count(),
      prisma.workflow.count({ where: { isActive: true } }),
      prisma.workflowExecution.count(),
    ]);
    return { totals: { users, workflows, activeWorkflows, executions } };
  },
};
