import { prisma } from '../../lib/prisma';

export const dashboardService = {
  async summary(userId: string) {
    const [totalWorkflows, activeWorkflows, totalExecutions, byStatus, recentExecutions, recentWorkflows] =
      await Promise.all([
        prisma.workflow.count({ where: { userId } }),
        prisma.workflow.count({ where: { userId, isActive: true } }),
        prisma.workflowExecution.count({ where: { userId } }),
        prisma.workflowExecution.groupBy({
          by: ['status'],
          where: { userId },
          _count: { _all: true },
        }),
        prisma.workflowExecution.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { workflow: { select: { id: true, name: true } } },
        }),
        prisma.workflow.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]);

    return {
      totals: {
        workflows: totalWorkflows,
        activeWorkflows,
        executions: totalExecutions,
      },
      executionsByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      recentExecutions,
      recentWorkflows,
    };
  },
};
