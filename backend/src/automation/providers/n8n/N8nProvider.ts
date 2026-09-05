import { env } from '../../../config/env';
import {
  AutomationError,
  AutomationProvider,
  EngineExecution,
  EngineExecutionStatus,
  TriggerInput,
} from '../../types';
import { n8nRequest } from './n8nClient';

interface N8nExecution {
  id: number | string;
  finished: boolean;
  stoppedAt: string | null;
  startedAt: string | null;
  status?: string; // newer n8n: 'success' | 'error' | 'running' | 'waiting'
  data?: { resultData?: { error?: { message?: string } } };
}

function mapStatus(e: N8nExecution): EngineExecutionStatus {
  if (e.status === 'error') return 'FAILED';
  if (e.status === 'success') return 'COMPLETED';
  if (e.status === 'running' || e.status === 'waiting') return 'RUNNING';
  if (e.finished) return e.data?.resultData?.error ? 'FAILED' : 'COMPLETED';
  return e.startedAt ? 'RUNNING' : 'PENDING';
}

/**
 * n8n adapter.
 *
 * - `trigger` calls the workflow's webhook (`engineRef` = webhook path). n8n's
 *   public REST API has no generic "run" endpoint, so Phase 1 workflows are
 *   expected to start with a Webhook node.
 * - `getExecution` / `ping` use the authenticated public REST API.
 */
export class N8nProvider implements AutomationProvider {
  readonly name = 'n8n';

  async ping(): Promise<boolean> {
    try {
      await n8nRequest('/workflows?limit=1');
      return true;
    } catch {
      return false;
    }
  }

  async trigger(input: TriggerInput): Promise<EngineExecution> {
    const ref = input.engineRef.replace(/^\/+/, '');
    if (!ref) throw new AutomationError('Workflow has no engine reference', 'INVALID_WORKFLOW');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.N8N_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${env.N8N_BASE_URL}/webhook/${ref}`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.payload ?? {}),
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new AutomationError('n8n workflow trigger timed out', 'TIMEOUT', err);
      }
      throw new AutomationError('n8n service is unreachable', 'UNAVAILABLE', err);
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 404) {
      throw new AutomationError(
        'n8n webhook not found — is the workflow active?',
        'INVALID_WORKFLOW',
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new AutomationError(`n8n trigger failed (${res.status}): ${body.slice(0, 200)}`, 'EXECUTION_ERROR');
    }

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const engineRef = String(
      body.executionId ?? body.execution_id ?? (body as { id?: unknown }).id ?? Date.now(),
    );

    return { engineRef, status: 'RUNNING', startedAt: new Date() };
  }

  async getExecution(engineRef: string): Promise<EngineExecution> {
    const e = await n8nRequest<N8nExecution>(`/executions/${engineRef}?includeData=true`);
    const status = mapStatus(e);
    return {
      engineRef: String(e.id),
      status,
      startedAt: e.startedAt ? new Date(e.startedAt) : undefined,
      finishedAt: e.stoppedAt ? new Date(e.stoppedAt) : undefined,
      errorMessage: status === 'FAILED' ? e.data?.resultData?.error?.message ?? 'Execution failed' : undefined,
    };
  }
}
