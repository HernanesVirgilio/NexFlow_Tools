import type { WorkflowDefinition } from '../services/types';

export type TemplateAvailability = 'available' | 'coming-soon';

export interface WorkflowTemplate {
  id: string;
  /** i18n key suffix under `templates.items.<id>` for title/description. */
  category: 'sales' | 'marketing' | 'support' | 'productivity' | 'it';
  apps: string[];
  availability: TemplateAvailability;
  /** Present only for `available` templates — a valid builder definition. */
  definition?: WorkflowDefinition;
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
    availability: 'available',
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
    availability: 'available',
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
    availability: 'available',
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
    availability: 'available',
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
  {
    id: 'supportAlert',
    category: 'support',
    apps: ['Webhook', 'Notification'],
    availability: 'coming-soon',
  },
  {
    id: 'emailDigest',
    category: 'marketing',
    apps: ['Schedule', 'Email'],
    availability: 'coming-soon',
  },
];

export const templateStepCount = (tpl: WorkflowTemplate) => tpl.definition?.nodes.length ?? 0;
