import type { WorkflowDefinition } from '../services/types';

// Every entry here is a real, usable template — no "coming soon" placeholders.
// A template whose node types (e.g. scheduled triggers, email/notification
// actions) aren't runnable yet in nodeCatalog does not belong in this catalogue
// until it is; see backend/src/automation/nodeCatalog.ts.
export interface WorkflowTemplate {
  id: string;
  /** i18n key suffix under `templates.items.<id>` for title/description. */
  category: 'sales' | 'productivity' | 'it';
  apps: string[];
  definition: WorkflowDefinition;
}

const pos = (x: number, y: number) => ({ x, y });

/** Node/edge helpers keep the definitions readable and consistent with nodeCatalog. */
const webhook = (id: string, path: string) => ({
  id,
  type: 'webhook',
  position: pos(80, 40),
  config: { method: 'POST', path },
});
const http = (id: string, y: number, url: string) => ({
  id,
  type: 'http',
  position: pos(80, y),
  config: { method: 'POST', url },
});
const transform = (id: string, y: number) => ({
  id,
  type: 'transform',
  position: pos(80, y),
  config: { expression: '' },
});
const condition = (id: string, y: number, field: string) => ({
  id,
  type: 'condition',
  position: pos(80, y),
  config: { field, operator: 'exists', value: '' },
});
const edge = (from: string, to: string) => ({ id: `e-${from}-${to}`, source: from, target: to });

export const TEMPLATE_CATALOG: WorkflowTemplate[] = [
  {
    id: 'leadNotification',
    category: 'sales',
    apps: ['Webhook', 'HTTP'],
    definition: {
      version: 1,
      nodes: [
        webhook('trigger', 'new-lead'),
        transform('shape', 160),
        http('notify', 280, 'https://example.com/notify'),
      ],
      edges: [edge('trigger', 'shape'), edge('shape', 'notify')],
    },
  },
  {
    id: 'formToTask',
    category: 'productivity',
    apps: ['Webhook', 'HTTP'],
    definition: {
      version: 1,
      nodes: [
        webhook('trigger', 'form-submission'),
        condition('check', 160, 'email'),
        http('createTask', 280, 'https://example.com/tasks'),
      ],
      edges: [edge('trigger', 'check'), edge('check', 'createTask')],
    },
  },
  {
    id: 'requestLogger',
    category: 'it',
    apps: ['Webhook', 'HTTP'],
    definition: {
      version: 1,
      nodes: [webhook('trigger', 'incoming'), http('log', 160, 'https://example.com/log')],
      edges: [edge('trigger', 'log')],
    },
  },
  {
    id: 'dataSync',
    category: 'it',
    apps: ['Webhook', 'HTTP'],
    definition: {
      version: 1,
      nodes: [
        webhook('trigger', 'record-changed'),
        http('fetch', 160, 'https://example.com/source'),
        http('push', 280, 'https://example.com/destination'),
      ],
      edges: [edge('trigger', 'fetch'), edge('fetch', 'push')],
    },
  },
];

export const templateStepCount = (tpl: WorkflowTemplate) => tpl.definition.nodes.length;
