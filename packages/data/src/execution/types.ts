import type { ToolRiskLevel } from '../tool-gateway/types';

export type ExecutionQueueStatus =
  | 'queued'
  | 'ready'
  | 'blocked'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'manual_required'
  | 'cancelled';

export interface ExecutionQueueItem {
  id: string;
  toolCallId: string;
  sourceId: string;
  toolId: string;
  toolName: string;
  sourceName: string;
  status: ExecutionQueueStatus;
  riskLevel: ToolRiskLevel;
  approvalRequired: boolean;
  approvedAt?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  manualReason?: string;
  auditIds: string[];
  automationRunId?: string;
  loopId?: string;
  routineId?: string;
}

export interface ExecutionSummary {
  id: string;
  toolCallId: string;
  toolName: string;
  sourceName: string;
  status: ExecutionQueueStatus;
  riskLevel: ToolRiskLevel;
  approvalRequired: boolean;
  approvedAt?: string;
  queuedAt: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  manualReason?: string;
  warnings: string[];
  automationRunId?: string;
  loopId?: string;
  routineId?: string;
}

export interface ExecutionHistoryEntry {
  id: string;
  queueItemId: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
