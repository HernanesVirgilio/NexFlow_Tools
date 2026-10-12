import { NODE_CATALOG } from '../../../automation/nodeCatalog';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';
import type { AIProvider } from './AIProvider';

const catalog = NODE_CATALOG.map(({ type, category, capability, isTrigger, defaultConfig }) => ({
  type,
  category,
  capability,
  isTrigger,
  defaultConfig,
}));

const SYSTEM_PROMPT = [
  'You propose a NexFlow workflow draft. Reply with one JSON object only.',
  'Shape: {"name":"","description":"","summary":"","definition":{"version":1,"nodes":[],"edges":[]}}',
  'name is 2–120 characters. description is at most 1000 characters. summary is one sentence.',
  'definition.nodes items: {"id","type","position":{"x":0,"y":0},"config":{},"label"?}.',
  'definition.edges items: {"id","source","target"}. Include at least one trigger and one edge when there are two nodes.',
  'Use only the node types in this catalogue. Fill config using each type defaultConfig.',
  'Do not invent credentials, tokens, or private data.',
  `Catalogue: ${JSON.stringify(catalog)}`,
].join('\n');

const SAFE_FAILURE = 'The AI provider could not prepare a proposal.';

/** Maps an OpenAI HTTP failure to a client-safe error. Never forwards the raw body. */
export function openAIFailure(status: number, errorCode: string): AppError {
  if (status === 401 || status === 403) {
    return new AppError(502, 'AI_PROVIDER_ERROR', 'The AI provider rejected the credentials.');
  }
  if (errorCode === 'insufficient_quota' || errorCode === 'credit_balance_exhausted') {
    return new AppError(402, 'AI_QUOTA_EXHAUSTED', 'The OpenAI account has no credit left.');
  }
  return new AppError(502, 'AI_PROVIDER_ERROR', SAFE_FAILURE);
}

export const openAIProvider: AIProvider = {
  id: 'openai',

  isConfigured() {
    return env.OPENAI_API_KEY.trim().length > 0;
  },

  async complete(userPrompt: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.OPENAI_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { code?: string };
      };
      if (!res.ok) throw openAIFailure(res.status, String(body.error?.code ?? ''));
      const content = body.choices?.[0]?.message?.content;
      if (!content?.trim()) throw new AppError(502, 'AI_PROVIDER_ERROR', SAFE_FAILURE);
      return content;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(502, 'AI_PROVIDER_ERROR', SAFE_FAILURE);
    } finally {
      clearTimeout(timer);
    }
  },
};
