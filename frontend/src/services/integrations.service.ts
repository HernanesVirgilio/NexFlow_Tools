import { api } from './api';
import type { IntegrationsOverview } from './types';

export const integrationsService = {
  overview: () => api.get<IntegrationsOverview>('/integrations'),
  connectUrl: () => api.get<{ url: string }>('/integrations/google/connect'),
  disconnectGoogle: () => api.del<void>('/integrations/google'),
};
