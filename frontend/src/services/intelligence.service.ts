import { api } from './api';
import type { IntelligenceMode, IntelligenceResult } from './types';

export const intelligenceService = {
  generate: (message: string, mode: IntelligenceMode) =>
    api.post<IntelligenceResult>('/intelligence/generate', { message, mode }),
};
