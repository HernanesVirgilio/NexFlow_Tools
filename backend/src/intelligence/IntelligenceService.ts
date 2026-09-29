import { AppError } from '../utils/AppError';
import { logger } from '../lib/logger';
import { nodeCatalogView } from '../automation/nodeCatalog';
import { workflowDefinitionSchema } from '../modules/workflows/workflow.schemas';
import { validateDefinition } from '../modules/workflows/workflow.validation';
import { GeminiProvider } from './providers/gemini/GeminiProvider';
import {
  AIProvider,
  GenerateResult,
  IMPLEMENTED_MODES,
  IntelligenceError,
  IntelligenceMode,
  WorkflowProposalResult,
} from './types';

/**
 * Facade the rest of the app talks to. Today there is one provider
 * (Gemini); IntelligenceService itself never touches a Gemini-specific
 * type — it only knows the AIProvider interface, so a second provider can
 * be added later (e.g. selected per user/plan) without rewriting this file.
 */
const provider: AIProvider = new GeminiProvider();

function toAppError(err: unknown): AppError {
  if (err instanceof IntelligenceError) {
    const map: Record<IntelligenceError['kind'], [number, string]> = {
      NOT_CONFIGURED: [501, 'NexFlow Intelligence is not configured yet'],
      AUTH: [502, 'The AI provider rejected our credentials'],
      UNAVAILABLE: [502, 'The AI provider is currently unavailable'],
      TIMEOUT: [504, 'The AI provider did not respond in time'],
      RATE_LIMITED: [429, 'Too many requests to the AI provider — please try again shortly'],
      INVALID_RESPONSE: [502, 'The AI provider returned an unexpected response'],
      UNKNOWN: [502, 'AI provider error'],
    };
    const [status, message] = map[err.kind];
    logger.warn('Intelligence provider error', { kind: err.kind, detail: err.message });
    return new AppError(status, `INTELLIGENCE_${err.kind}`, message);
  }
  logger.error('Unexpected intelligence failure', { err: String(err) });
  return AppError.upstream('Intelligence error');
}

/** Model output is untrusted input: same schema + validation gate as every other workflow definition. */
async function buildWorkflowProposal(message: string): Promise<WorkflowProposalResult> {
  const draft = await provider.generateWorkflowDraft({ message, nodeTypes: nodeCatalogView() });

  const parsed = workflowDefinitionSchema.safeParse(draft.definition);
  if (!parsed.success) {
    return {
      type: 'workflow_proposal',
      title: draft.title,
      description: draft.description,
      definition: { version: 1, nodes: [], edges: [] },
      issues: [
        {
          code: 'GENERATION_FAILED',
          message: 'NexFlow Intelligence could not produce a valid workflow for this request yet.',
        },
      ],
      runnable: false,
    };
  }

  const result = validateDefinition(parsed.data, { forExecution: true });
  return {
    type: 'workflow_proposal',
    title: draft.title,
    description: draft.description,
    definition: parsed.data,
    issues: result.issues,
    runnable: result.ok,
  };
}

export const intelligenceService = {
  async generate(
    userId: string,
    input: { message: string; mode: IntelligenceMode },
  ): Promise<GenerateResult> {
    const start = Date.now();
    logger.info('Intelligence request started', { userId, mode: input.mode, provider: provider.name });

    if (!IMPLEMENTED_MODES.includes(input.mode)) {
      throw new AppError(501, 'INTELLIGENCE_MODE_NOT_IMPLEMENTED', `The "${input.mode}" capability is coming soon`);
    }

    try {
      const result: GenerateResult =
        input.mode === 'automation'
          ? await buildWorkflowProposal(input.message)
          : { type: 'answer', content: await provider.generateAnswer({ message: input.message, mode: input.mode }) };

      logger.info('Intelligence request completed', {
        userId,
        mode: input.mode,
        resultType: result.type,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (err) {
      const appError = toAppError(err);
      logger.warn('Intelligence request failed', {
        userId,
        mode: input.mode,
        code: appError.code,
        durationMs: Date.now() - start,
      });
      throw appError;
    }
  },
};
