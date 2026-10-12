import { z } from 'zod';

export const generateBodySchema = z.object({
  prompt: z.string().trim().min(2).max(2000),
});
