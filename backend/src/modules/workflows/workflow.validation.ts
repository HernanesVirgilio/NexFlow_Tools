import { getNodeDef } from '../../automation/nodeCatalog';
import type { WorkflowDefinition } from './workflow.schemas';

export interface ValidationIssue {
  code:
    | 'EMPTY'
    | 'NO_TRIGGER'
    | 'UNKNOWN_NODE_TYPE'
    | 'DUPLICATE_NODE_ID'
    | 'DUPLICATE_EDGE_ID'
    | 'EDGE_ENDPOINT_MISSING'
    | 'EDGE_SELF_LOOP'
    | 'CONFIG_INCOMPLETE'
    | 'NODE_COMING_SOON'
    | 'NOT_RUNNABLE'
    /** Not produced by validateDefinition() itself — used by callers (e.g. Intelligence)
     *  that hand back a ValidationIssue[] when a generation step failed upstream. */
    | 'GENERATION_FAILED';
  message: string;
  nodeId?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  /** Derived n8n webhook path when the trigger is a configured `webhook` node. */
  runnableRef?: string;
}

interface Options {
  /** Additional gates that only matter to run/activate a workflow. */
  forExecution?: boolean;
  /** Fallback engine reference stored on the workflow row (legacy Phase 1 path). */
  engineRef?: string | null;
}

/**
 * Structural + capability validation of a builder definition.
 * Frontend runs an equivalent check for UX; this is the security/integrity gate.
 */
export function validateDefinition(
  definition: WorkflowDefinition,
  { forExecution = false, engineRef = null }: Options = {},
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { nodes, edges } = definition;

  if (nodes.length === 0) {
    return { ok: false, issues: [{ code: 'EMPTY', message: 'Workflow has no nodes' }] };
  }

  const seenNodeIds = new Set<string>();
  for (const node of nodes) {
    if (seenNodeIds.has(node.id)) {
      issues.push({ code: 'DUPLICATE_NODE_ID', message: `Duplicate node id "${node.id}"`, nodeId: node.id });
    }
    seenNodeIds.add(node.id);

    const def = getNodeDef(node.type);
    if (!def) {
      issues.push({ code: 'UNKNOWN_NODE_TYPE', message: `Unknown node type "${node.type}"`, nodeId: node.id });
      continue;
    }

    const missing = def.validateConfig(node.config ?? {});
    if (missing.length) {
      issues.push({
        code: 'CONFIG_INCOMPLETE',
        message: `Node "${node.id}" is missing configuration: ${missing.join(', ')}`,
        nodeId: node.id,
      });
    }
    if (forExecution && def.capability === 'coming-soon') {
      issues.push({
        code: 'NODE_COMING_SOON',
        message: `Node type "${node.type}" is not available yet`,
        nodeId: node.id,
      });
    }
  }

  const seenEdgeIds = new Set<string>();
  for (const edge of edges) {
    if (seenEdgeIds.has(edge.id)) {
      issues.push({ code: 'DUPLICATE_EDGE_ID', message: `Duplicate edge id "${edge.id}"` });
    }
    seenEdgeIds.add(edge.id);
    if (edge.source === edge.target) {
      issues.push({ code: 'EDGE_SELF_LOOP', message: `Edge "${edge.id}" connects a node to itself` });
    }
    if (!seenNodeIds.has(edge.source) || !seenNodeIds.has(edge.target)) {
      issues.push({
        code: 'EDGE_ENDPOINT_MISSING',
        message: `Edge "${edge.id}" references a node that does not exist`,
      });
    }
  }

  const triggers = nodes.filter((n) => getNodeDef(n.type)?.isTrigger);
  if (triggers.length === 0) {
    issues.push({ code: 'NO_TRIGGER', message: 'Workflow needs a trigger node' });
  }

  // A workflow can run today only through an n8n webhook: either a configured
  // `webhook` trigger node, or a legacy engineRef on the row.
  const webhookNode = nodes.find(
    (n) => n.type === 'webhook' && getNodeDef('webhook')!.validateConfig(n.config ?? {}).length === 0,
  );
  const runnableRef = webhookNode
    ? String((webhookNode.config as { path?: unknown }).path)
    : engineRef ?? undefined;

  if (forExecution && !runnableRef) {
    issues.push({
      code: 'NOT_RUNNABLE',
      message: 'Add a configured Webhook trigger (or an engine reference) before running this workflow',
    });
  }

  return { ok: issues.length === 0, issues, runnableRef };
}
