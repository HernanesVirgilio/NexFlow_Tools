import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { automationService } from '../../automation/AutomationService';

async function getOwned(id: string, userId: string) {
  const exec = await prisma.workflowExecution.findUnique({
    where: { id },
    include: { workflow: true },
  });
  if (!exec || exec.userId !== userId) throw AppError.notFound('Execution not found');
  return exec;
}

export const executionService = {
  /** All executions for the user, newest first. */
  list(userId: string, limit = 50) {
    return prisma.workflowExecution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: { workflow: { select: { id: true, name: true } } },
    });
  },

  async listForWorkflow(workflowId: string, userId: string) {
    const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!wf || wf.userId !== userId) throw AppError.notFound('Workflow not found');
    return prisma.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Returns the stored execution, refreshing it from the engine first if it is
   * still in flight. Keeps the DB the source of truth for history.
   */
  async get(id: string, userId: string) {
    const exec = await getOwned(id, userId);
    if ((exec.status === 'RUNNING' || exec.status === 'PENDING') && exec.engineRef) {
      try {
        const fresh = await automationService.getExecution(exec.workflow.engine, exec.engineRef);
        if (fresh.status !== exec.status) {
          const finishedAt = fresh.finishedAt ?? (fresh.status === 'COMPLETED' || fresh.status === 'FAILED' ? new Date() : null);
          return prisma.workflowExecution.update({
            where: { id },
            data: {
              status: fresh.status,
              finishedAt,
              durationMs: finishedAt && exec.startedAt ? finishedAt.getTime() - exec.startedAt.getTime() : null,
              errorMessage: fresh.errorMessage ?? null,
            },
          });
        }
      } catch {
        // Engine unreachable — return the last known state rather than failing.
      }
    }
    return exec;
  },
};
