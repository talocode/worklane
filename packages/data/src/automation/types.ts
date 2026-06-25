export type AutomationTriggerType = 'manual' | 'schedule' | 'api' | 'chat' | 'github_placeholder';

export type LoopStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export type RoutineStatus = 'active' | 'paused' | 'archived';

export type AutomationRunStatus = 'pending_approval' | 'approved' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';

export type PermissionProfile = 'read_only' | 'draft_only' | 'approval_required' | 'manual_only';

export interface AutomationReport {
  summary: string;
  runId: string;
  createdAt: string;
  notes: string[];
  toolCallIds: string[];
}

export interface WorkLaneLoop {
  id: string;
  name: string;
  task: string;
  toolGatewayToolIds: string[];
  triggerType: 'schedule';
  intervalMinutes: number;
  status: LoopStatus;
  approvalRequired: true;
  permissionProfile: PermissionProfile;
  expiresAt: string;
  nextRunAt: string;
  lastRunAt?: string;
  lastCatchUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLaneRoutine {
  id: string;
  name: string;
  description: string;
  task: string;
  triggerType: AutomationTriggerType;
  toolGatewayToolIds: string[];
  status: RoutineStatus;
  approvalRequired: true;
  permissionProfile: PermissionProfile;
  schedule?: {
    intervalMinutes?: number;
    nextRunAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRunRecord {
  id: string;
  sourceType: 'loop' | 'routine';
  sourceId: string;
  sourceName: string;
  task: string;
  toolGatewayToolIds: string[];
  status: AutomationRunStatus;
  approvalRequired: true;
  permissionProfile: PermissionProfile;
  triggerType: AutomationTriggerType;
  runMode: 'manual' | 'scheduler';
  scheduledFor?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  report?: AutomationReport;
}

export interface AutomationHistoryEntry {
  id: string;
  automationType: 'loop' | 'routine' | 'run';
  automationId: string;
  action: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface LoopInput {
  name: string;
  task: string;
  intervalMinutes: number;
  toolGatewayToolIds?: string[];
  expiresAt?: string;
  permissionProfile?: PermissionProfile;
}

export interface RoutineInput {
  name: string;
  description: string;
  task: string;
  triggerType?: AutomationTriggerType;
  toolGatewayToolIds?: string[];
  permissionProfile?: PermissionProfile;
  schedule?: WorkLaneRoutine['schedule'];
}
