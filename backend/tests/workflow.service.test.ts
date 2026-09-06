import { beforeEach, describe, expect, it, vi } from 'vitest';

/** In-memory Prisma / automation doubles — no database, no network. */
const { db, trigger } = vi.hoisted(() => ({
  db: {
    workflow: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workflowExecution: { create: vi.fn(), update: vi.fn() },
  },
  trigger: vi.fn(),
}));
vi.mock('../src/lib/prisma', () => ({ prisma: db }));
vi.mock('../src/automation/AutomationService', () => ({ automationService: { trigger } }));

import { workflowService } from '../src/modules/workflows/workflow.service';

const OWNER = 'user-1';
const OTHER = 'user-2';
const baseWf = {
  id: 'wf1',
  userId: OWNER,
  name: 'Test',
  description: null,
  isActive: true,
  engine: 'n8n',
  engineRef: null as string | null,
  definition: null as unknown,
};

beforeEach(() => {
  vi.clearAllMocks();
  db.workflow.findUnique.mockResolvedValue({ ...baseWf });
  db.workflowExecution.create.mockResolvedValue({ id: 'exec1' });
  db.workflowExecution.update.mockImplementation(({ data }: { data: unknown }) => Promise.resolve(data));
  trigger.mockResolvedValue({ engineRef: 'run-1', status: 'RUNNING', startedAt: new Date() });
});

describe('workflow ownership', () => {
  it('hides another user’s workflow on read', async () => {
    await expect(workflowService.get('wf1', OTHER)).rejects.toMatchObject({ statusCode: 404 });
  });
  it('hides another user’s workflow on execute', async () => {
    await expect(workflowService.execute('wf1', OTHER)).rejects.toMatchObject({ statusCode: 404 });
    expect(db.workflowExecution.create).not.toHaveBeenCalled();
  });
});

describe('execute — validation before any execution record', () => {
  it('rejects an invalid definition with 422 and creates no execution row', async () => {
    db.workflow.findUnique.mockResolvedValue({
      ...baseWf,
      definition: { version: 1, nodes: [{ id: 'a', type: 'manual', position: { x: 0, y: 0 }, config: {} }], edges: [] },
    });
    await expect(workflowService.execute('wf1', OWNER)).rejects.toMatchObject({
      statusCode: 422,
      code: 'WORKFLOW_INVALID',
    });
    expect(db.workflowExecution.create).not.toHaveBeenCalled();
    expect(trigger).not.toHaveBeenCalled();
  });

  it('runs a workflow whose definition has a configured webhook trigger', async () => {
    db.workflow.findUnique.mockResolvedValue({
      ...baseWf,
      definition: {
        version: 1,
        nodes: [{ id: 't', type: 'webhook', position: { x: 0, y: 0 }, config: { method: 'POST', path: 'lead' } }],
        edges: [],
      },
    });
    await workflowService.execute('wf1', OWNER);
    expect(trigger).toHaveBeenCalledWith('n8n', { engineRef: 'lead' });
    expect(db.workflowExecution.create).toHaveBeenCalledTimes(1);
  });

  it('keeps the Phase 1 path: legacy engineRef, no definition', async () => {
    db.workflow.findUnique.mockResolvedValue({ ...baseWf, engineRef: 'legacy/hook' });
    await workflowService.execute('wf1', OWNER);
    expect(trigger).toHaveBeenCalledWith('n8n', { engineRef: 'legacy/hook' });
  });

  it('refuses to run an inactive workflow', async () => {
    db.workflow.findUnique.mockResolvedValue({ ...baseWf, isActive: false, engineRef: 'x' });
    await expect(workflowService.execute('wf1', OWNER)).rejects.toMatchObject({ statusCode: 400 });
  });
});
