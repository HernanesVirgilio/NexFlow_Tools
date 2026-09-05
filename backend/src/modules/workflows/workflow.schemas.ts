import { z } from 'zod';

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  engineRef: z.string().trim().max(200).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const idParam = z.object({ id: z.string().cuid() });
