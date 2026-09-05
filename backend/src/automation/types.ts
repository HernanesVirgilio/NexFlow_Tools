/**
 * Engine-agnostic automation contract.
 *
 *   NexFlow app  ->  AutomationService  ->  AutomationProvider (n8n today, others later)
 *
 * Nothing outside this folder should import an n8n type directly.
 */

export type EngineExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface EngineExecution {
  engineRef: string;
  status: EngineExecutionStatus;
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string;
}

export interface TriggerInput {
  /** Provider-specific workflow reference (e.g. n8n workflow id). */
  engineRef: string;
  /** Optional payload passed to the workflow run. */
  payload?: Record<string, unknown>;
}

export interface AutomationProvider {
  readonly name: string;
  /** Cheap reachability/auth check for health endpoints. */
  ping(): Promise<boolean>;
  /** Start a run and return its engine reference + initial status. */
  trigger(input: TriggerInput): Promise<EngineExecution>;
  /** Fetch the current state of a previously started run. */
  getExecution(engineRef: string): Promise<EngineExecution>;
}

export class AutomationError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | 'UNAVAILABLE'
      | 'TIMEOUT'
      | 'AUTH'
      | 'NOT_FOUND'
      | 'INVALID_WORKFLOW'
      | 'EXECUTION_ERROR'
      | 'UNKNOWN' = 'UNKNOWN',
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AutomationError';
  }
}
