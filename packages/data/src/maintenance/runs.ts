import { approveAutomationRun, rejectAutomationRun } from '../automation/approvals';
import { createRoutine, runRoutineNow } from '../automation/routines';
import { getMaintenanceRoutine } from './routines';
import { maintenanceStorage } from './storage';
import type { MaintenanceEvidenceReport, MaintenanceRunInput, MaintenanceRunRecord } from './types';

const DEFAULT_LIMITS = {
  maxFiles: 20,
  maxPatchLines: 300,
  maxRuntimeMinutes: 20,
};

function createId(): string {
  return `maint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function requireInteger(value: number | undefined, fallback: number, min: number, max: number, field: string): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < min || resolved > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}.`);
  }
  return resolved;
}

function normalizeRepo(repo: string): string {
  const normalized = repo.trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalized)) {
    throw new Error('repo must use owner/repository format.');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('repo contains an invalid path segment.');
  }
  return normalized;
}

function normalizeBaseRef(baseRef?: string): string {
  const normalized = (baseRef || 'main').trim();
  if (!/^[A-Za-z0-9._/-]+$/.test(normalized) || normalized.includes('..')) {
    throw new Error('baseRef contains unsupported characters.');
  }
  return normalized;
}

function createEvidenceReport(runId: string, routineChecks: string[]): MaintenanceEvidenceReport {
  return {
    runId,
    evidenceStatus: 'not_collected',
    summary: 'No repository execution has occurred. This run is waiting for approval and a connected execution tool.',
    reproduction: null,
    rootCause: null,
    proposedChange: null,
    filesChanged: [],
    verification: [],
    risks: ['Execution is simulated until an approved repository tool is connected.'],
    confidence: null,
    rollback: null,
    unresolved: ['Repository findings have not been collected.'],
    requiredEvidence: [...routineChecks],
    createdAt: new Date().toISOString(),
  };
}

export function createMaintenanceRun(input: MaintenanceRunInput): MaintenanceRunRecord {
  const routineDefinition = getMaintenanceRoutine(input.routineId);
  if (!routineDefinition) throw new Error('Unknown maintenance routine.');

  const repo = normalizeRepo(input.repo);
  const baseRef = normalizeBaseRef(input.baseRef);
  const limits = {
    maxFiles: requireInteger(input.maxFiles, DEFAULT_LIMITS.maxFiles, 1, 500, 'maxFiles'),
    maxPatchLines: requireInteger(input.maxPatchLines, DEFAULT_LIMITS.maxPatchLines, 1, 5000, 'maxPatchLines'),
    maxRuntimeMinutes: requireInteger(input.maxRuntimeMinutes, DEFAULT_LIMITS.maxRuntimeMinutes, 1, 120, 'maxRuntimeMinutes'),
  };
  const notes = (input.notes || '').trim().slice(0, 1000);
  const routine = createRoutine({
    name: `${routineDefinition.name} - ${repo}`,
    description: routineDefinition.description,
    task: [
      `Prepare a ${routineDefinition.name} maintenance proposal for ${repo} at ${baseRef}.`,
      `Inspect at most ${limits.maxFiles} files, propose at most ${limits.maxPatchLines} changed lines, and stop after ${limits.maxRuntimeMinutes} minutes.`,
      'Return reproduction, root cause, proposed change, verification, risks, confidence, rollback, and unresolved items.',
    ].join(' '),
    triggerType: 'manual',
    toolGatewayToolIds: [],
    permissionProfile: 'draft_only',
  });
  const automationRun = runRoutineNow(routine);
  const now = new Date().toISOString();
  const id = createId();
  const run: MaintenanceRunRecord = {
    id,
    routineId: routineDefinition.id,
    routineName: routineDefinition.name,
    repo,
    baseRef,
    status: 'pending_approval',
    approvalRequired: true,
    executionMode: 'simulated',
    limits,
    notes,
    automationRoutineId: routine.id,
    automationRunId: automationRun.id,
    createdAt: now,
    updatedAt: now,
    report: createEvidenceReport(id, routineDefinition.verificationChecks),
  };
  return maintenanceStorage.runs.save(run);
}

export function listMaintenanceRuns(): MaintenanceRunRecord[] {
  return maintenanceStorage.runs.list();
}

export function getMaintenanceRun(id: string): MaintenanceRunRecord | undefined {
  return maintenanceStorage.runs.get(id);
}

export function getMaintenanceReport(id: string): MaintenanceEvidenceReport | undefined {
  return getMaintenanceRun(id)?.report;
}

export function approveMaintenanceRun(id: string, approvedBy = 'user'): MaintenanceRunRecord | null {
  const run = getMaintenanceRun(id);
  if (!run) return null;
  if (run.status === 'rejected') throw new Error('Rejected maintenance runs cannot be approved.');
  const automationRun = approveAutomationRun(run.automationRunId, approvedBy);
  if (!automationRun) throw new Error('Linked automation run was not found.');
  const approvedAt = new Date().toISOString();
  return maintenanceStorage.runs.save({ ...run, status: 'approved', approvedAt, approvedBy, updatedAt: approvedAt });
}

export function rejectMaintenanceRun(id: string, rejectedBy = 'user', reason?: string): MaintenanceRunRecord | null {
  const run = getMaintenanceRun(id);
  if (!run) return null;
  const automationRun = rejectAutomationRun(run.automationRunId, rejectedBy, reason);
  if (!automationRun) throw new Error('Linked automation run was not found.');
  const rejectedAt = new Date().toISOString();
  return maintenanceStorage.runs.save({
    ...run,
    status: 'rejected',
    rejectedAt,
    rejectedBy,
    rejectionReason: reason?.slice(0, 300),
    updatedAt: rejectedAt,
  });
}
