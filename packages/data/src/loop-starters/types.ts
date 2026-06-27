import type { PermissionProfile } from '../automation/types';

export type WorkLaneLoopStarterRisk = 'low' | 'medium' | 'high';

export type WorkLaneLoopStarterCategory =
  | 'coding'
  | 'operations'
  | 'maintenance'
  | 'release'
  | 'support';

export type WorkLaneLoopStarterMode = 'report_only' | 'approval_required';

export type WorkLaneLoopStarter = {
  id: string;
  name: string;
  description: string;
  category: WorkLaneLoopStarterCategory;
  risk: WorkLaneLoopStarterRisk;
  suggestedCadence: string;
  defaultMode: WorkLaneLoopStarterMode;
  requiredTools: string[];
  permissionProfile: PermissionProfile;
  stateSchema: Record<string, unknown>;
  routineTemplate: Record<string, unknown>;
  verificationChecks: string[];
  failurePolicy: string[];
  finalReportFields: string[];
};

export interface LoopStarterInstantiateInput {
  title: string;
  repo: string;
  cadence: string;
  toolIds: string[];
  mode: WorkLaneLoopStarterMode;
  notes?: string;
}

export interface LoopStarterRoutineDraft {
  id: string;
  name: string;
  description: string;
  task: string;
  triggerType: 'manual' | 'schedule';
  toolGatewayToolIds: string[];
  status: 'draft';
  approvalRequired: true;
  permissionProfile: PermissionProfile;
  mode: WorkLaneLoopStarterMode;
  starterId: string;
  repo: string;
  cadence: string;
  notes: string;
  state: Record<string, unknown>;
  schedule?: {
    intervalMinutes?: number;
    nextRunAt?: string;
  };
  createdAt: string;
}

export interface LoopStarterInstantiateResult {
  routineDraft: LoopStarterRoutineDraft;
  permissionProfile: PermissionProfile;
  approvalRequired: true;
  requiredTools: string[];
  verificationChecklist: string[];
  warnings: string[];
}