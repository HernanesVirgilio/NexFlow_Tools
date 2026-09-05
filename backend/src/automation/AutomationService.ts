import { AppError } from '../utils/AppError';
import { logger } from '../lib/logger';
import { N8nProvider } from './providers/n8n/N8nProvider';
import { AutomationError, AutomationProvider, EngineExecution, TriggerInput } from './types';

/**
 * Facade the rest of the app talks to. Selects a provider by name and
 * normalises provider failures into AppErrors with safe messages.
 */
const providers: Record<string, AutomationProvider> = {
  n8n: new N8nProvider(),
};

function resolveProvider(engine: string): AutomationProvider {
  const p = providers[engine];
  if (!p) throw AppError.badRequest(`Unknown automation engine: ${engine}`);
  return p;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AutomationError) {
    const map: Record<AutomationError['kind'], [number, string]> = {
      UNAVAILABLE: [502, 'The automation engine is currently unavailable'],
      TIMEOUT: [504, 'The automation engine did not respond in time'],
      AUTH: [502, 'The automation engine rejected our credentials'],
      NOT_FOUND: [404, 'Automation resource not found'],
      INVALID_WORKFLOW: [422, 'This workflow cannot be executed yet'],
      EXECUTION_ERROR: [502, 'The automation engine reported an error'],
      UNKNOWN: [502, 'Automation engine error'],
    };
    const [status, message] = map[err.kind];
    logger.warn('Automation error', { kind: err.kind, detail: err.message });
    return new AppError(status, `AUTOMATION_${err.kind}`, message);
  }
  logger.error('Unexpected automation failure', { err: String(err) });
  return AppError.upstream('Automation engine error');
}

export const automationService = {
  async health(engine = 'n8n'): Promise<boolean> {
    try {
      return await resolveProvider(engine).ping();
    } catch {
      return false;
    }
  },

  async trigger(engine: string, input: TriggerInput): Promise<EngineExecution> {
    try {
      return await resolveProvider(engine).trigger(input);
    } catch (err) {
      throw toAppError(err);
    }
  },

  async getExecution(engine: string, engineRef: string): Promise<EngineExecution> {
    try {
      return await resolveProvider(engine).getExecution(engineRef);
    } catch (err) {
      throw toAppError(err);
    }
  },
};
