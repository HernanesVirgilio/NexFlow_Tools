import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { automationService } from '../../automation/AutomationService';
import { createWorkflowSchema, updateWorkflowSchema } from './workflow.schemas';

/** Loads a workflow and asserts the requesting user owns it. */
async function getOwned(id: string, userId: string) {
  const wf = await prisma.workflow.findUnique({ where: { id } });
  if (!wf || wf.userId !== userId) throw AppError.notFound('Workflow not found');
  return wf;
}

export const workflowService = {
  list(userId: string) {
    return prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { executions: true } } },
    });
  },

  async get(id: string, userId: string) {
    await getOwned(id, userId);
    return prisma.workflow.findUnique({
      where: { id },
      include: { _count: { select: { executions: true } } },
    });
  },

  create(userId: string, input: z.infer<typeof createWorkflowSchema>) {
    return prisma.workflow.create({ data: { ...input, userId } });
  },

  async update(id: string, userId: string, input: z.infer<typeof updateWorkflowSchema>) {
    const wf = await getOwned(id, userId);
    if (input.isActive && !(input.engineRef ?? wf.engineRef)) {
      throw AppError.badRequest('Add an engine reference before activating this workflow');
    }
    return prisma.workflow.update({ where: { id }, data: input });
  },

  async remove(id: string, userId: string) {
    await getOwned(id, userId);
    await prisma.workflow.delete({ where: { id } });
  },

  /** Manually run a workflow. Creates an execution row, then triggers the engine. */
  async execute(id: string, userId: string) {
    const wf = await getOwned(id, userId);
    if (!wf.isActive) throw AppError.badRequest('Activate the workflow before running it');
    if (!wf.engineRef) throw AppError.badRequest('This workflow has no engine reference');

    const execution = await prisma.workflowExecution.create({
      data: { workflowId: wf.id, userId, status: 'PENDING' },
    });

    try {
      const result = await automationService.trigger(wf.engine, { engineRef: wf.engineRef });
      return prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: result.status === 'PENDING' ? 'RUNNING' : result.status,
          engineRef: result.engineRef,
          startedAt: result.startedAt ?? new Date(),
        },
      });
    } catch (err) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage: err instanceof AppError ? err.message : 'Failed to start execution',
        },
      });
      throw err;
    }
  },
};
