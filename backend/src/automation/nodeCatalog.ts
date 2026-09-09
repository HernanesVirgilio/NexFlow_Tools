/**
 * Authoritative NexFlow node catalogue.
 *
 * This is the single source of truth for which node types exist, what they
 * need, and whether they can actually run today. The frontend consumes it via
 * `GET /api/workflows/node-types` — it must not maintain a separate list.
 *
 * Capability:
 *  - `available`               works with default config, nothing to set up
 *  - `configuration-required`  valid once its required config is filled in
 *  - `coming-soon`             may be placed in a draft, but a workflow that
 *                              contains one cannot be activated or executed
 */

export type NodeCapability = 'available' | 'configuration-required' | 'coming-soon';
export type NodeCategory = 'trigger' | 'action' | 'communication' | 'logic' | 'ai';

export interface NodeTypeDef {
  type: string;
  category: NodeCategory;
  capability: NodeCapability;
  isTrigger: boolean;
  defaultConfig: Record<string, unknown>;
  /** Returns the keys that are missing or invalid ([] = configuration is complete). */
  validateConfig(config: Record<string, unknown>): string[];
}

const nonEmptyString = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const CONDITION_OPS = ['equals', 'notEquals', 'contains', 'gt', 'lt', 'exists'];
const DELAY_UNITS = ['seconds', 'minutes', 'hours'];

export const NODE_CATALOG: NodeTypeDef[] = [
  {
    type: 'manual',
    category: 'trigger',
    capability: 'available',
    isTrigger: true,
    defaultConfig: {},
    validateConfig: () => [],
  },
  {
    type: 'webhook',
    category: 'trigger',
    capability: 'configuration-required',
    isTrigger: true,
    defaultConfig: { method: 'POST', path: '' },
    validateConfig: (c) => {
      const missing: string[] = [];
      if (!nonEmptyString(c.path)) missing.push('path');
      if (!HTTP_METHODS.includes(String(c.method))) missing.push('method');
      return missing;
    },
  },
  {
    type: 'http',
    category: 'action',
    capability: 'configuration-required',
    isTrigger: false,
    defaultConfig: { method: 'GET', url: '' },
    validateConfig: (c) => {
      const missing: string[] = [];
      if (!HTTP_METHODS.includes(String(c.method))) missing.push('method');
      if (!nonEmptyString(c.url) || !/^https?:\/\//i.test(String(c.url))) missing.push('url');
      return missing;
    },
  },
  {
    type: 'transform',
    category: 'action',
    capability: 'configuration-required',
    isTrigger: false,
    defaultConfig: { expression: '' },
    validateConfig: () => [],
  },
  {
    type: 'delay',
    category: 'action',
    capability: 'configuration-required',
    isTrigger: false,
    defaultConfig: { duration: 1, unit: 'minutes' },
    validateConfig: (c) => {
      const missing: string[] = [];
      if (typeof c.duration !== 'number' || c.duration <= 0) missing.push('duration');
      if (!DELAY_UNITS.includes(String(c.unit))) missing.push('unit');
      return missing;
    },
  },
  {
    type: 'condition',
    category: 'logic',
    capability: 'configuration-required',
    isTrigger: false,
    defaultConfig: { field: '', operator: 'equals', value: '' },
    validateConfig: (c) => {
      const missing: string[] = [];
      if (!nonEmptyString(c.field)) missing.push('field');
      if (!CONDITION_OPS.includes(String(c.operator))) missing.push('operator');
      if (c.operator !== 'exists' && c.value === undefined) missing.push('value');
      return missing;
    },
  },
  {
    type: 'email',
    category: 'communication',
    capability: 'coming-soon',
    isTrigger: false,
    defaultConfig: {},
    validateConfig: () => [],
  },
  {
    type: 'notification',
    category: 'communication',
    capability: 'coming-soon',
    isTrigger: false,
    defaultConfig: {},
    validateConfig: () => [],
  },
  {
    type: 'nexflow-intelligence',
    category: 'ai',
    capability: 'coming-soon',
    isTrigger: false,
    defaultConfig: {},
    validateConfig: () => [],
  },
];

const byType = new Map(NODE_CATALOG.map((n) => [n.type, n]));

export const getNodeDef = (type: string): NodeTypeDef | undefined => byType.get(type);

/** Serialisable view for the API (drops the function). Labels are i18n keys on the client. */
export const nodeCatalogView = () =>
  NODE_CATALOG.map(({ validateConfig, ...def }) => def);
