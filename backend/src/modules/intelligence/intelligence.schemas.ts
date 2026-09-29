import { z } from 'zod';
import { INTELLIGENCE_MODES } from '../../intelligence/types';

export const generateSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000),
  mode: z.enum(INTELLIGENCE_MODES).default('ask'),
});
