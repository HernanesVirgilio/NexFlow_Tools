export type ToolCategory = 'productivity' | 'communication' | 'storage' | 'social' | 'content' | 'other';

export interface CatalogTool {
  id: string;
  category: ToolCategory;
  /** Initial shown as the tile mark — no external logo assets are bundled. */
  mark: string;
}

/**
 * Static "what could connect to NexFlow" catalogue. `connected` is always
 * false today — there is no OAuth/integration backend yet (see
 * AutomationService — n8n is the only wired provider). Never render one of
 * these as connected; the modal must say so honestly.
 */
export const TOOL_CATALOG: CatalogTool[] = [
  { id: 'gmail', category: 'communication', mark: 'G' },
  { id: 'googleDrive', category: 'storage', mark: 'D' },
  { id: 'googleCalendar', category: 'productivity', mark: 'C' },
  { id: 'outlook', category: 'communication', mark: 'O' },
  { id: 'notion', category: 'productivity', mark: 'N' },
  { id: 'slack', category: 'communication', mark: 'S' },
  { id: 'whatsapp', category: 'communication', mark: 'W' },
  { id: 'youtube', category: 'content', mark: 'Y' },
  { id: 'dropbox', category: 'storage', mark: 'D' },
  { id: 'oneDrive', category: 'storage', mark: 'O' },
  { id: 'trello', category: 'productivity', mark: 'T' },
  { id: 'github', category: 'other', mark: 'G' },
];

export const TOOL_CATEGORIES: ToolCategory[] = [
  'productivity',
  'communication',
  'storage',
  'social',
  'content',
  'other',
];
