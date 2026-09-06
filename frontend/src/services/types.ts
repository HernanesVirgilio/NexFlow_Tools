export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  language: 'en' | 'pt';
  theme: 'light' | 'dark' | 'system';
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  engine: string;
  engineRef: string | null;
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
  totals: { workflows: number; activeWorkflows: number; executions: number };
  executionsByStatus: Partial<Record<ExecutionStatus, number>>;
  recentExecutions: WorkflowExecution[];
  recentWorkflows: RecentWorkflow[];
}
