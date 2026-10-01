import { z } from 'zod';

export const googleCallbackSchema = z.object({
  code: z.string().min(1, 'Missing authorization code'),
  state: z.string().min(1, 'Missing state'),
});
