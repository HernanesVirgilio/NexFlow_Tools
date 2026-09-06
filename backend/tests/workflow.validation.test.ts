import { describe, expect, it } from 'vitest';
import { validateDefinition } from '../src/modules/workflows/workflow.validation';
import type { WorkflowDefinition } from '../src/modules/workflows/workflow.schemas';

const node = (id: string, type: string, config: Record<string, unknown> = {}): WorkflowDefinition['nodes'][number] => ({
  id,
  type,
  position: { x: 0, y: 0 },
  config,
});

const def = (nodes: WorkflowDefinition['nodes'], edges: WorkflowDefinition['edges'] = []): WorkflowDefinition => ({
  version: 1,
  nodes,
  edges,
});

describe('validateDefinition — structure', () => {
  it('rejects an empty workflow', () => {
    const r = validateDefinition(def([]));
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe('EMPTY');
  });

  it('requires a trigger node', () => {
    const r = validateDefinition(def([node('a', 'http', { method: 'GET', url: 'https://x.dev' })]));
    expect(r.issues.map((i) => i.code)).toContain('NO_TRIGGER');
  });

  it('rejects unknown node types', () => {
    const r = validateDefinition(def([node('a', 'telepathy')]));
    expect(r.issues.map((i) => i.code)).toContain('UNKNOWN_NODE_TYPE');
  });

  it('rejects duplicate node ids', () => {
    const r = validateDefinition(def([node('dup', 'manual'), node('dup', 'manual')]));
    expect(r.issues.map((i) => i.code)).toContain('DUPLICATE_NODE_ID');
  });

  it('rejects edges to missing nodes and self-loops', () => {
    const r = validateDefinition(
      def(
        [node('a', 'manual')],
        [
          { id: 'e1', source: 'a', target: 'ghost' },
          { id: 'e2', source: 'a', target: 'a' },
        ],
      ),
    );
    const codes = r.issues.map((i) => i.code);
    expect(codes).toContain('EDGE_ENDPOINT_MISSING');
    expect(codes).toContain('EDGE_SELF_LOOP');
  });

  it('reports incomplete node configuration', () => {
    const r = validateDefinition(def([node('a', 'webhook', { method: 'POST', path: '' })]));
    const issue = r.issues.find((i) => i.code === 'CONFIG_INCOMPLETE');
    expect(issue?.nodeId).toBe('a');
    expect(issue?.message).toMatch(/path/);
  });

  it('accepts a well-formed manual-trigger workflow (structure only)', () => {
    const r = validateDefinition(def([node('t', 'manual'), node('h', 'http', { method: 'GET', url: 'https://api.dev' })], [{ id: 'e', source: 't', target: 'h' }]));
    expect(r.ok).toBe(true);
  });
});

describe('validateDefinition — execution gates', () => {
  it('blocks execution when a coming-soon node is present', () => {
    const r = validateDefinition(
      def([node('t', 'webhook', { method: 'POST', path: 'lead' }), node('ai', 'nexflow-intelligence')]),
      { forExecution: true },
    );
    expect(r.issues.map((i) => i.code)).toContain('NODE_COMING_SOON');
    expect(r.ok).toBe(false);
  });

  it('blocks execution without a runnable trigger (manual only)', () => {
    const r = validateDefinition(def([node('t', 'manual')]), { forExecution: true });
    expect(r.issues.map((i) => i.code)).toContain('NOT_RUNNABLE');
  });

  it('derives the webhook path as the runnable ref', () => {
    const r = validateDefinition(def([node('t', 'webhook', { method: 'POST', path: 'new-lead' })]), {
      forExecution: true,
    });
    expect(r.ok).toBe(true);
    expect(r.runnableRef).toBe('new-lead');
  });

  it('falls back to a legacy engineRef when there is no webhook node', () => {
    const r = validateDefinition(def([node('t', 'manual')]), { forExecution: true, engineRef: 'legacy/path' });
    expect(r.ok).toBe(true);
    expect(r.runnableRef).toBe('legacy/path');
  });
});
