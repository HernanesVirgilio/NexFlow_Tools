import { z } from 'zod';

/** One node in the visual builder graph. `type` is checked against the catalogue in validation. */
export const workflowNodeSchema = z.object({
  id: z.string().trim().min(1).max(64),
  type: z.string().trim().min(1).max(64),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.unknown()).default({}),
  label: z.string().trim().max(120).optional(),
});

export const workflowEdgeSchema = z.object({
  id: z.string().trim().min(1).max(64),
  source: z.string().trim().min(1).max(64),
  target: z.string().trim().min(1).max(64),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
});

export const workflowDefinitionSchema = z.object({
  version: z.literal(1).default(1),
  nodes: z.array(workflowNodeSchema).max(100),
  edges: z.array(workflowEdgeSchema).max(200),
});

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  engineRef: z.string().trim().max(200).optional(),
  definition: workflowDefinitionSchema.optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  isActive: z.boolean().optional(),
  definition: workflowDefinitionSchema.nullable().optional(),
});

export const idParam = z.object({ id: z.string().cuid() });
