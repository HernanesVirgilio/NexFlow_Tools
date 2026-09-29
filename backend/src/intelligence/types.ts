/**
 * Provider-agnostic Intelligence contract.
 *
 *   NexFlow app  ->  IntelligenceService  ->  AIProvider (Gemini today, others later)
 *
 * Mirrors backend/src/automation/types.ts on purpose — same shape of
 * problem (one internal facade, swappable external providers), so the same
 * pattern is reused rather than inventing a second one. Nothing outside
 * this folder should import a Gemini-specific type.
 */

import type { NodeTypeDef } from '../automation/nodeCatalog';
import type { ValidationIssue } from '../modules/workflows/workflow.validation';
import type { WorkflowDefinition } from '../modules/workflows/workflow.schemas';

export const INTELLIGENCE_MODES = [
  'ask',
  'think',
  'programming',
  'analysis',
  'image',
  'video',
  'presentation',
  'automation',
] as const;
export type IntelligenceMode = (typeof INTELLIGENCE_MODES)[number];

/** Modes with a real backend capability today — everything else answers 501 honestly. */
export const IMPLEMENTED_MODES: readonly IntelligenceMode[] = ['ask', 'think', 'programming', 'automation'];

export interface AnswerRequest {
  message: string;
  mode: IntelligenceMode;
}

export interface WorkflowDraftRequest {
  message: string;
  /** The real, current node catalogue — the model may only use these types. */
  nodeTypes: Omit<NodeTypeDef, 'validateConfig'>[];
}

/** Untrusted model output — always re-validated by workflowDefinitionSchema + validateDefinition(). */
export interface RawWorkflowDraft {
  title: string;
  description: string;
  definition: unknown;
}

export interface AIProvider {
  readonly name: string;
  generateAnswer(input: AnswerRequest): Promise<string>;
  generateWorkflowDraft(input: WorkflowDraftRequest): Promise<RawWorkflowDraft>;
}

export interface AnswerResult {
  type: 'answer';
  content: string;
}

export interface WorkflowProposalResult {
  type: 'workflow_proposal';
  title: string;
  description: string;
  definition: WorkflowDefinition;
  issues: ValidationIssue[];
  /** True only when validateDefinition({ forExecution: true }) passed with no issues. */
  runnable: boolean;
}

export type GenerateResult = AnswerResult | WorkflowProposalResult;

export class IntelligenceError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | 'NOT_CONFIGURED'
      | 'AUTH'
      | 'UNAVAILABLE'
      | 'TIMEOUT'
      | 'RATE_LIMITED'
      | 'INVALID_RESPONSE'
      | 'UNKNOWN' = 'UNKNOWN',
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IntelligenceError';
  }
}
