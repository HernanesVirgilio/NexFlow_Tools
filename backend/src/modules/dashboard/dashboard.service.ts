import { prisma } from '../../lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export const dashboardService = {
  async summary(userId: string) {
    const since7d = new Date(Date.now() - 7 * DAY_MS);

    const [
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      byStatus,
      byStatus7d,
      recentExecutions,
      recentWorkflows,
    ] = await Promise.all([
      prisma.workflow.count({ where: { userId } }),
      prisma.workflow.count({ where: { userId, isActive: true } }),
      prisma.workflowExecution.count({ where: { userId } }),
      prisma.workflowExecution.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.workflowExecution.groupBy({
        by: ['status'],
        where: { userId, createdAt: { gte: since7d } },
        _count: { _all: true },
      }),
      prisma.workflowExecution.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { workflow: { select: { id: true, name: true } } },
      }),
      prisma.workflow.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: {
          _count: { select: { executions: true } },
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true, createdAt: true },
          },
        },
      }),
    ]);

    const toMap = (rows: { status: string; _count: { _all: number } }[]) =>
      Object.fromEntries(rows.map((s) => [s.status, s._count._all]));

    const last7d = toMap(byStatus7d);
    const executions7dTotal = Object.values(last7d).reduce((a, b) => a + b, 0);

    // Recent activity — derived only from real records (no events/audit table):
    // workflow creation + execution outcomes, merged and sorted.
    const activity = [
      ...recentWorkflows.map((w) => ({
        type: 'workflow_created' as const,
        workflowId: w.id,
        workflowName: w.name,
        at: w.createdAt,
      })),
      ...recentExecutions.map((e) => ({
        type: (
          e.status === 'COMPLETED'
            ? 'execution_completed'
            : e.status === 'FAILED'
              ? 'execution_failed'
              : 'execution_started'
        ) as 'execution_completed' | 'execution_failed' | 'execution_started',
        workflowId: e.workflow?.id ?? null,
        workflowName: e.workflow?.name ?? null,
        at: e.startedAt ?? e.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);

    return {
      totals: {
        workflows: totalWorkflows,
        activeWorkflows,
        executions: totalExecutions,
        executions7d: executions7dTotal,
      },
      executionsByStatus: toMap(byStatus),
      executions7d: last7d,
      recentActivity: activity,
      recentExecutions,
      // Flatten the single-element `executions` include into `lastExecution`.
      recentWorkflows: recentWorkflows.map(({ executions, ...w }) => ({
        ...w,
        lastExecution: executions[0] ?? null,
      })),
    };
  },
};
