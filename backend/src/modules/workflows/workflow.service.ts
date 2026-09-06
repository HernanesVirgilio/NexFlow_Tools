import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { automationService } from '../../automation/AutomationService';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  workflowDefinitionSchema,
  type WorkflowDefinition,
} from './workflow.schemas';
import { validateDefinition } from './workflow.validation';

/** Loads a workflow and asserts the requesting user owns it. */
async function getOwned(id: string, userId: string) {
  const wf = await prisma.workflow.findUnique({ where: { id } });
  if (!wf || wf.userId !== userId) throw AppError.notFound('Workflow not found');
  return wf;
}

/** Parse a stored `definition` JSON value; returns null when absent/blank. */
function parseDefinition(value: unknown): WorkflowDefinition | null {
  if (value == null) return null;
  const parsed = workflowDefinitionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Structural + capability check; throws 422 WORKFLOW_INVALID with the issue list. */
function assertRunnable(definition: WorkflowDefinition, engineRef: string | null): string {
  const result = validateDefinition(definition, { forExecution: true, engineRef });
  if (!result.ok) {
    throw new AppError(422, 'WORKFLOW_INVALID', 'This workflow cannot run yet', { issues: result.issues });
  }
  return result.runnableRef!;
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
    const { definition, ...rest } = input;
    return prisma.workflow.create({
      data: {
        ...rest,
        userId,
        ...(definition ? { definition: definition as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  },

  async update(id: string, userId: string, input: z.infer<typeof updateWorkflowSchema>) {
    const wf = await getOwned(id, userId);
    const { definition, ...rest } = input;

    const nextDefinition =
      definition === undefined ? parseDefinition(wf.definition) : definition ?? null;

    if (rest.isActive === true) {
      if (nextDefinition) {
        assertRunnable(nextDefinition, rest.engineRef ?? wf.engineRef);
      } else if (!(rest.engineRef ?? wf.engineRef)) {
        throw AppError.badRequest('Add an engine reference before activating this workflow');
      }
    }

    const data: Prisma.WorkflowUpdateInput = { ...rest };
    if (definition !== undefined) {
      data.definition =
        definition === null
          ? Prisma.DbNull
          : (definition as unknown as Prisma.InputJsonValue);
    }

    return prisma.workflow.update({ where: { id }, data });
  },

  async remove(id: string, userId: string) {
    await getOwned(id, userId);
    await prisma.workflow.delete({ where: { id } });
  },

  /** Manually run a workflow. Validates first, then creates an execution row and triggers the engine. */
  async execute(id: string, userId: string) {
    const wf = await getOwned(id, userId);
    if (!wf.isActive) throw AppError.badRequest('Activate the workflow before running it');

    const definition = parseDefinition(wf.definition);
    // Validation happens BEFORE any execution row is created — invalid workflows
    // never leave a fake PENDING record behind.
    const engineRef = definition
      ? assertRunnable(definition, wf.engineRef)
      : (() => {
          if (!wf.engineRef) throw AppError.badRequest('This workflow has no engine reference');
          return wf.engineRef;
        })();

    const execution = await prisma.workflowExecution.create({
      data: { workflowId: wf.id, userId, status: 'PENDING' },
    });

    try {
      const result = await automationService.trigger(wf.engine, { engineRef });
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
