import { getNodeDef } from '../../automation/nodeCatalog';
import { AppError } from '../../utils/AppError';
import { workflowDefinitionSchema, type WorkflowDefinition } from '../workflows/workflow.schemas';
import { validateDefinition, type ValidationIssue } from '../workflows/workflow.validation';
import type { AIProvider } from './providers/AIProvider';
import { openAIProvider } from './providers/OpenAIProvider';

export interface IntelligenceWarning {
  code: string;
  message: string;
}

export interface IntelligenceProposalView {
  name: string;
  description?: string;
  summary?: string;
  definition: WorkflowDefinition;
}

export interface IntelligenceGenerateResult {
  proposal: IntelligenceProposalView | null;
  issues: ValidationIssue[];
  warnings: IntelligenceWarning[];
}

const UNREADABLE = 'The proposal could not be read.';

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new AppError(422, 'INTELLIGENCE_INVALID', UNREADABLE);
  }
}

/**
 * Turns a model reply into a reviewable proposal.
 * Does not write a workflow, activate it, or execute it.
 */
export function createIntelligenceService(provider: AIProvider) {
  return {
    async generate(prompt: string): Promise<IntelligenceGenerateResult> {
      if (!provider.isConfigured()) {
        throw new AppError(503, 'PROVIDER_UNAVAILABLE', 'NexFlow Intelligence is not configured.');
      }

      let raw: string;
      try {
        raw = await provider.complete(prompt);
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(502, 'AI_PROVIDER_ERROR', 'The AI provider could not prepare a proposal.');
      }
      const body = readJson(raw);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new AppError(422, 'INTELLIGENCE_INVALID', UNREADABLE);
      }
      const record = body as Record<string, unknown>;

      const parsed = workflowDefinitionSchema.safeParse(record.definition);
      if (!parsed.success) throw new AppError(422, 'INTELLIGENCE_INVALID', UNREADABLE);

      const name = clip(record.name, 120);
      if (!name || name.length < 2) throw new AppError(422, 'INTELLIGENCE_INVALID', UNREADABLE);

      if (parsed.data.nodes.length === 0) {
        return {
          proposal: null,
          issues: [{ code: 'EMPTY', message: 'Workflow has no nodes' }],
          warnings: [],
        };
      }

      const checked = validateDefinition(parsed.data);
      const description = clip(record.description, 1000);
      const summary = clip(record.summary, 400);
      const warnings: IntelligenceWarning[] = parsed.data.nodes.flatMap((node) => {
        const def = getNodeDef(node.type);
        if (def?.capability !== 'coming-soon') return [];
        return [{ code: 'COMING_SOON', message: `Step "${node.type}" can be saved in a draft but cannot run yet.` }];
      });

      return {
        proposal: {
          name,
          ...(description ? { description } : {}),
          ...(summary ? { summary } : {}),
          definition: parsed.data,
        },
        issues: checked.issues,
        warnings,
      };
    },
  };
}

export const intelligenceService = createIntelligenceService(openAIProvider);
