import { ApiError, api } from './api';
import type { ValidationIssue, WorkflowDefinition } from './types';

/**
 * Client for POST /api/intelligence/generate (Alexandre's contract).
 *
 * Body: { prompt: string }
 * 200: { proposal, issues?, warnings? }
 *   proposal: { name, description?, summary?, definition } or null when there
 *   is nothing to review.
 *
 * This client never invents a proposal. A missing route or an unconfigured
 * provider becomes INTELLIGENCE_UNAVAILABLE. Nothing is saved or executed here.
 */
export interface ProposalWarning {
  code: string;
  message: string;
}

export interface IntelligenceProposal {
  name: string;
  description?: string;
  summary?: string;
  definition: WorkflowDefinition;
  issues: ValidationIssue[];
  warnings: ProposalWarning[];
}

export type GenerateResult = { status: 'proposal'; proposal: IntelligenceProposal } | { status: 'empty' };

export type ParsedProposal =
  | { kind: 'proposal'; proposal: IntelligenceProposal }
  | { kind: 'empty' }
  | { kind: 'invalid' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIssueList(value: unknown): value is ValidationIssue[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      isRecord(item) &&
      typeof item.code === 'string' &&
      typeof item.message === 'string' &&
      (item.nodeId === undefined || typeof item.nodeId === 'string'),
  );
}

function isWarningList(value: unknown): value is ProposalWarning[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => isRecord(item) && typeof item.code === 'string' && typeof item.message === 'string');
}

function parseDefinition(value: unknown): WorkflowDefinition | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null;
  }
  const nodesOk = value.nodes.every(
    (node) =>
      isRecord(node) &&
      typeof node.id === 'string' &&
      node.id.length > 0 &&
      typeof node.type === 'string' &&
      node.type.length > 0 &&
      isRecord(node.position) &&
      typeof node.position.x === 'number' &&
      typeof node.position.y === 'number' &&
      (node.config === undefined || isRecord(node.config)),
  );
  const edgesOk = value.edges.every(
    (edge) =>
      isRecord(edge) &&
      typeof edge.id === 'string' &&
      typeof edge.source === 'string' &&
      typeof edge.target === 'string',
  );
  if (!nodesOk || !edgesOk) return null;
  return {
    version: 1,
    nodes: value.nodes.map((node) => {
      const n = node as Record<string, unknown>;
      const position = n.position as { x: number; y: number };
      return {
        id: n.id as string,
        type: n.type as string,
        position: { x: position.x, y: position.y },
        config: isRecord(n.config) ? n.config : {},
        ...(typeof n.label === 'string' ? { label: n.label } : {}),
      };
    }),
    edges: value.edges.map((edge) => {
      const e = edge as Record<string, unknown>;
      return { id: e.id as string, source: e.source as string, target: e.target as string };
    }),
  };
}

/** Accept only the published envelope. Anything else is invalid, never filled in. */
export function parseIntelligenceResponse(data: unknown): ParsedProposal {
  if (!isRecord(data) || !('proposal' in data)) return { kind: 'invalid' };
  if (data.proposal === null) return { kind: 'empty' };
  if (!isRecord(data.proposal)) return { kind: 'invalid' };

  const name = typeof data.proposal.name === 'string' ? data.proposal.name.trim() : '';
  const definition = parseDefinition(data.proposal.definition);
  if (!definition || name.length < 2 || name.length > 120) return { kind: 'invalid' };
  if (definition.nodes.length === 0) return { kind: 'empty' };

  if (data.issues !== undefined && !isIssueList(data.issues)) return { kind: 'invalid' };
  if (data.warnings !== undefined && !isWarningList(data.warnings)) return { kind: 'invalid' };

  const description = data.proposal.description;
  const summary = data.proposal.summary;
  if (description !== undefined && (typeof description !== 'string' || description.length > 1000)) {
    return { kind: 'invalid' };
  }
  if (summary !== undefined && typeof summary !== 'string') return { kind: 'invalid' };

  return {
    kind: 'proposal',
    proposal: {
      name,
      ...(typeof description === 'string' && description.trim() ? { description: description.trim() } : {}),
      ...(typeof summary === 'string' && summary.trim() ? { summary: summary.trim() } : {}),
      definition,
      issues: isIssueList(data.issues) ? data.issues : [],
      warnings: isWarningList(data.warnings) ? data.warnings : [],
    },
  };
}

function unavailable(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return (
    err.status === 404 ||
    err.status === 501 ||
    err.status === 503 ||
    err.code === 'PROVIDER_UNAVAILABLE' ||
    err.code === 'INTELLIGENCE_UNAVAILABLE'
  );
}

export const intelligenceService = {
  async generate(prompt: string): Promise<GenerateResult> {
    let data: unknown;
    try {
      data = await api.post<unknown>('/intelligence/generate', { prompt });
    } catch (err) {
      if (unavailable(err)) throw new ApiError(503, 'INTELLIGENCE_UNAVAILABLE', 'unavailable');
      throw err;
    }
    const parsed = parseIntelligenceResponse(data);
    if (parsed.kind === 'invalid') throw new ApiError(502, 'INTELLIGENCE_INVALID', 'invalid');
    if (parsed.kind === 'empty') return { status: 'empty' };
    return { status: 'proposal', proposal: parsed.proposal };
  },
};
