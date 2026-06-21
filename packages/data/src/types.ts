export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  skills: string[];
  systemPrompt?: string;
  model?: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  secretRef: string;
  config: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStep {
  id: string;
  runId: string;
  order: number;
  description: string;
  tool?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: string;
  error?: string;
}

export interface TaskRun {
  id: string;
  workspaceId: string;
  agentId: string;
  task: string;
  status: 'pending_approval' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';
  executionMode: 'simulated' | 'live';
  riskLevel: 'low' | 'medium' | 'high';
  plan: TaskStep[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  result?: string;
  error?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  runId: string;
  workspaceId: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiredPermissions: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface Trigger {
  id: string;
  workspaceId: string;
  name: string;
  type: 'manual' | 'schedule' | 'event';
  agentId: string;
  task: string;
  schedule?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  actorType: 'user' | 'agent' | 'system';
  action: string;
  target: string;
  targetType: string;
  result: 'success' | 'failure' | 'pending';
  metadata?: Record<string, unknown>;
  timestamp: string;
}
