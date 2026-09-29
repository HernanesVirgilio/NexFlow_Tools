import { geminiGenerateContent } from './geminiClient';
import { AIProvider, AnswerRequest, IntelligenceError, RawWorkflowDraft, WorkflowDraftRequest } from '../../types';

interface GeminiPart {
  text?: string;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  ask: 'You are NexFlow Intelligence, a helpful, concise assistant embedded in an automation product. Answer the user directly and clearly.',
  think:
    'You are NexFlow Intelligence. Consider the problem carefully, then respond with a clear, well-structured analysis. Present only your final analysis and conclusion — never a step-by-step internal monologue.',
  programming:
    'You are NexFlow Intelligence, acting as a senior software engineer. Help with debugging, code generation, code review or architecture questions. Use fenced code blocks for code.',
};

function extractText(res: unknown): string {
  const candidates = (res as GeminiResponse)?.candidates;
  const text = candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) {
    throw new IntelligenceError('Gemini returned an empty response', 'INVALID_RESPONSE');
  }
  return text.trim();
}

/** First real AIProvider implementation. Nothing outside this folder should import a Gemini type. */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  async generateAnswer({ message, mode }: AnswerRequest): Promise<string> {
    const instruction = MODE_INSTRUCTIONS[mode] ?? MODE_INSTRUCTIONS.ask;
    const res = await geminiGenerateContent({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });
    return extractText(res);
  }

  async generateWorkflowDraft({ message, nodeTypes }: WorkflowDraftRequest): Promise<RawWorkflowDraft> {
    const usable = nodeTypes.filter((n) => n.capability !== 'coming-soon');
    const catalogue = usable
      .map((n) => `- "${n.type}" (${n.category}${n.isTrigger ? ', trigger' : ''}) — default config: ${JSON.stringify(n.defaultConfig)}`)
      .join('\n');

    const instruction = `You are NexFlow Intelligence's workflow generator. Convert the user's automation request into a JSON object with exactly this shape and nothing else:
{"title": string, "description": string, "definition": {"version": 1, "nodes": [{"id": string, "type": string, "position": {"x": number, "y": number}, "config": object}], "edges": [{"id": string, "source": string, "target": string}]}}

Only use these node types — nothing else exists in NexFlow today:
${catalogue}

Rules:
- Exactly one trigger node. Prefer "webhook" with a short kebab-case "path" in its config so the workflow is runnable immediately.
- Keep the graph small (2-5 nodes), connected left-to-right by edges, no cycles.
- Never invent a node type that is not listed above.
- Respond with raw JSON only — no prose, no markdown code fences.`;

    const res = await geminiGenerateContent({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const text = extractText(res);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new IntelligenceError('Gemini returned a response that was not valid JSON', 'INVALID_RESPONSE', err);
    }
    if (typeof parsed !== 'object' || parsed === null) {
      throw new IntelligenceError('Gemini returned an unexpected response shape', 'INVALID_RESPONSE');
    }
    const draft = parsed as Record<string, unknown>;
    return {
      title: String(draft.title ?? 'Untitled workflow').slice(0, 120),
      description: String(draft.description ?? '').slice(0, 1000),
      definition: draft.definition,
    };
  }
}
