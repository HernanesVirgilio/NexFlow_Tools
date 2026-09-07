export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  language: 'en' | 'pt';
  theme: 'light' | 'dark' | 'system';
}

export type NodeCapability = 'available' | 'configuration-required' | 'coming-soon';
export type NodeCategory = 'trigger' | 'action' | 'communication' | 'logic' | 'ai';

export interface NodeTypeDef {
  type: string;
  category: NodeCategory;
  capability: NodeCapability;
  isTrigger: boolean;
  defaultConfig: Record<string, unknown>;
}

export interface BuilderNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  label?: string;
}

export interface BuilderEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowDefinition {
  version: 1;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  nodeId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  engine: string;
  engineRef: string | null;
  definition: WorkflowDefinition | null;
  createdAt: string;
  updatedAt: string;
  _count?: { executions: number };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  engineRef: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  workflow?: { id: string; name: string };
}

export interface RecentWorkflow extends Workflow {
  lastExecution: { status: ExecutionStatus; createdAt: string } | null;
}

export interface DashboardSummary {
  totals: { workflows: number; activeWorkflows: number; executions: number; executions7d: number };
  executionsByStatus: Partial<Record<ExecutionStatus, number>>;
  executions7d: Partial<Record<ExecutionStatus, number>>;
  recentExecutions: WorkflowExecution[];
  recentWorkflows: RecentWorkflow[];
}
