import type { IconName } from '../ui/Icon';
import type { NodeCategory } from '../../services/types';

/** Client-side presentation for each node type. The catalogue itself is backend-owned. */
export const NODE_ICON: Record<string, IconName> = {
  manual: 'hand',
  webhook: 'zap',
  http: 'globe',
  transform: 'shuffle',
  delay: 'clock',
  condition: 'branch',
  email: 'mail',
  notification: 'bell',
  'nexflow-intelligence': 'sparkles',
};

export const CATEGORY_ORDER: NodeCategory[] = ['trigger', 'action', 'communication', 'logic', 'ai'];

export const nodeIcon = (type: string): IconName => NODE_ICON[type] ?? 'workflows';
