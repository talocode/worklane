export type MaintenanceRoutineId =
  | 'flaky-test-diagnosis'
  | 'dead-code-candidates'
  | 'duplicate-implementation-detection';

export type MaintenanceRunStatus = 'pending_approval' | 'approved' | 'rejected';

export interface MaintenanceRoutineDefinition {
  id: MaintenanceRoutineId;
  name: string;
  description: string;
  risk: 'medium';
  defaultCadence: string;
  permissionProfile: 'draft_only';
  steps: string[];
  constraints: string[];
  verificationChecks: string[];
  reportFields: string[];
}

export interface MaintenanceRunInput {
  routineId: MaintenanceRoutineId;
  repo: string;
  baseRef?: string;
  maxFiles?: number;
  maxPatchLines?: number;
  maxRuntimeMinutes?: number;
  notes?: string;
}

export interface MaintenanceEvidenceReport {
  runId: string;
  evidenceStatus: 'not_collected';
  summary: string;
  reproduction: null;
  rootCause: null;
  proposedChange: null;
  filesChanged: string[];
  verification: string[];
  risks: string[];
  confidence: null;
  rollback: null;
  unresolved: string[];
  requiredEvidence: string[];
  createdAt: string;
}

export interface MaintenanceRunRecord {
  id: string;
  routineId: MaintenanceRoutineId;
  routineName: string;
  repo: string;
  baseRef: string;
  status: MaintenanceRunStatus;
  approvalRequired: true;
  executionMode: 'simulated';
  limits: {
    maxFiles: number;
    maxPatchLines: number;
    maxRuntimeMinutes: number;
  };
  notes: string;
  automationRoutineId: string;
  automationRunId: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  report: MaintenanceEvidenceReport;
}
