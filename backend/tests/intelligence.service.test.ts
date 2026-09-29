import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Double the AIProvider boundary only — everything else (schema, validateDefinition) is real. */
const { generateAnswer, generateWorkflowDraft } = vi.hoisted(() => ({
  generateAnswer: vi.fn(),
  generateWorkflowDraft: vi.fn(),
}));
vi.mock('../src/intelligence/providers/gemini/GeminiProvider', () => ({
  GeminiProvider: class {
    name = 'gemini';
    generateAnswer = generateAnswer;
    generateWorkflowDraft = generateWorkflowDraft;
  },
}));

import { intelligenceService } from '../src/intelligence/IntelligenceService';
import { IntelligenceError } from '../src/intelligence/types';

const USER = 'user-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('conversational modes', () => {
  it('returns a real answer from the provider', async () => {
    generateAnswer.mockResolvedValue('Kubernetes is a container orchestrator.');
    const result = await intelligenceService.generate(USER, { message: 'Explain Kubernetes', mode: 'ask' });
    expect(result).toEqual({ type: 'answer', content: 'Kubernetes is a container orchestrator.' });
    expect(generateAnswer).toHaveBeenCalledWith({ message: 'Explain Kubernetes', mode: 'ask' });
  });

  it('maps a provider error to a safe AppError, never a fake answer', async () => {
    generateAnswer.mockRejectedValue(new IntelligenceError('boom', 'UNAVAILABLE'));
    await expect(intelligenceService.generate(USER, { message: 'hi', mode: 'ask' })).rejects.toMatchObject({
      statusCode: 502,
      code: 'INTELLIGENCE_UNAVAILABLE',
    });
  });

  it('reports a not-configured provider honestly (501), never a fake answer', async () => {
    generateAnswer.mockRejectedValue(new IntelligenceError('no key', 'NOT_CONFIGURED'));
    await expect(intelligenceService.generate(USER, { message: 'hi', mode: 'ask' })).rejects.toMatchObject({
      statusCode: 501,
      code: 'INTELLIGENCE_NOT_CONFIGURED',
    });
  });

  it('rejects a not-yet-implemented capability without calling the provider', async () => {
    await expect(intelligenceService.generate(USER, { message: 'draw a cat', mode: 'image' })).rejects.toMatchObject({
      statusCode: 501,
      code: 'INTELLIGENCE_MODE_NOT_IMPLEMENTED',
    });
    expect(generateAnswer).not.toHaveBeenCalled();
  });
});

describe('automation mode — proposal only, never executed', () => {
  it('returns a runnable proposal for a valid generated definition', async () => {
    generateWorkflowDraft.mockResolvedValue({
      title: 'Notify team of new leads',
      description: 'Webhook -> notify',
      definition: {
        version: 1,
        nodes: [
          { id: 'trigger', type: 'webhook', position: { x: 0, y: 0 }, config: { method: 'POST', path: 'new-lead' } },
          { id: 'notify', type: 'http', position: { x: 200, y: 0 }, config: { method: 'POST', url: 'https://example.com/notify' } },
        ],
        edges: [{ id: 'e1', source: 'trigger', target: 'notify' }],
      },
    });

    const result = await intelligenceService.generate(USER, {
      message: 'Notify my team when a new lead arrives',
      mode: 'automation',
    });

    expect(result.type).toBe('workflow_proposal');
    if (result.type !== 'workflow_proposal') throw new Error('unreachable');
    expect(result.runnable).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.definition.nodes).toHaveLength(2);
  });

  it('surfaces an honest issue for a structurally invalid definition — never fabricates a fix', async () => {
    generateWorkflowDraft.mockResolvedValue({
      title: 'Broken',
      description: '',
      definition: { version: 1, nodes: 'not-an-array', edges: [] },
    });

    const result = await intelligenceService.generate(USER, { message: 'do something', mode: 'automation' });
    expect(result.type).toBe('workflow_proposal');
    if (result.type !== 'workflow_proposal') throw new Error('unreachable');
    expect(result.runnable).toBe(false);
    expect(result.issues[0].code).toBe('GENERATION_FAILED');
    expect(result.definition.nodes).toEqual([]);
  });

  it('surfaces real validateDefinition issues (e.g. no trigger) instead of hiding them', async () => {
    generateWorkflowDraft.mockResolvedValue({
      title: 'No trigger',
      description: '',
      definition: {
        version: 1,
        nodes: [{ id: 'a', type: 'http', position: { x: 0, y: 0 }, config: { method: 'GET', url: 'https://example.com' } }],
        edges: [],
      },
    });

    const result = await intelligenceService.generate(USER, { message: 'do something', mode: 'automation' });
    expect(result.type).toBe('workflow_proposal');
    if (result.type !== 'workflow_proposal') throw new Error('unreachable');
    expect(result.runnable).toBe(false);
    expect(result.issues.some((i) => i.code === 'NO_TRIGGER')).toBe(true);
  });

  it('never creates a workflow or triggers execution — proposal only', async () => {
    generateWorkflowDraft.mockResolvedValue({
      title: 'x',
      description: '',
      definition: { version: 1, nodes: [], edges: [] },
    });
    const result = await intelligenceService.generate(USER, { message: 'x', mode: 'automation' });
    expect(result.type).toBe('workflow_proposal');
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('workflowId');
  });
});
