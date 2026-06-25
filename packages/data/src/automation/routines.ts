import { automationStorage } from './storage';
import { approvalRequired, defaultPermissionProfile, permissionProfileRules, validateToolPermissions } from './permissions';
import { createHistoryEntry } from './history';
import { normalizeTriggerType } from './triggers';
import { createAutomationReport } from './reporter';
import type { AutomationRunRecord, RoutineInput, WorkLaneRoutine } from './types';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createRoutine(input: RoutineInput): WorkLaneRoutine {
  const toolIds = input.toolGatewayToolIds || [];
  const permissions = validateToolPermissions(toolIds);
  if (!permissions.valid) {
    throw new Error(permissions.reasons.join(' '));
  }

  const createdAt = new Date().toISOString();
  const routine: WorkLaneRoutine = {
    id: createId('routine'),
    name: input.name,
    description: input.description,
    task: input.task,
    triggerType: normalizeTriggerType(input.triggerType),
    toolGatewayToolIds: toolIds,
    status: 'active',
    approvalRequired: approvalRequired(),
    permissionProfile: input.permissionProfile || defaultPermissionProfile(),
    schedule: input.schedule,
    createdAt,
    updatedAt: createdAt,
  };

  automationStorage.routines.save(routine);
  automationStorage.history.append(createHistoryEntry('routine', routine.id, 'routine.created', { rules: permissionProfileRules(routine.permissionProfile) }));
  return routine;
}

export function listRoutines(): WorkLaneRoutine[] {
  return automationStorage.routines.list();
}

export function getRoutine(id: string): WorkLaneRoutine | undefined {
  return automationStorage.routines.get(id);
}

export function updateRoutine(id: string, patch: Partial<RoutineInput>): WorkLaneRoutine | null {
  const routine = getRoutine(id);
  if (!routine) return null;
  const toolIds = patch.toolGatewayToolIds || routine.toolGatewayToolIds;
  const permissions = validateToolPermissions(toolIds);
  if (!permissions.valid) {
    throw new Error(permissions.reasons.join(' '));
  }
  const updated: WorkLaneRoutine = {
    ...routine,
    name: patch.name ?? routine.name,
    description: patch.description ?? routine.description,
    task: patch.task ?? routine.task,
    triggerType: patch.triggerType ? normalizeTriggerType(patch.triggerType) : routine.triggerType,
    toolGatewayToolIds: toolIds,
    permissionProfile: patch.permissionProfile ?? routine.permissionProfile,
    schedule: patch.schedule ?? routine.schedule,
    updatedAt: new Date().toISOString(),
  };
  automationStorage.routines.save(updated);
  automationStorage.history.append(createHistoryEntry('routine', id, 'routine.updated'));
  return updated;
}

export function pauseRoutine(id: string): WorkLaneRoutine | null {
  const routine = getRoutine(id);
  if (!routine) return null;
  const updated = { ...routine, status: 'paused' as const, updatedAt: new Date().toISOString() };
  automationStorage.routines.save(updated);
  automationStorage.history.append(createHistoryEntry('routine', id, 'routine.paused'));
  return updated;
}

export function resumeRoutine(id: string): WorkLaneRoutine | null {
  const routine = getRoutine(id);
  if (!routine) return null;
  const updated = { ...routine, status: 'active' as const, updatedAt: new Date().toISOString() };
  automationStorage.routines.save(updated);
  automationStorage.history.append(createHistoryEntry('routine', id, 'routine.resumed'));
  return updated;
}

export function archiveRoutine(id: string): WorkLaneRoutine | null {
  const routine = getRoutine(id);
  if (!routine) return null;
  const updated = { ...routine, status: 'archived' as const, updatedAt: new Date().toISOString() };
  automationStorage.routines.save(updated);
  automationStorage.history.append(createHistoryEntry('routine', id, 'routine.archived'));
  return updated;
}

export function runRoutineNow(routine: WorkLaneRoutine): AutomationRunRecord {
  const now = new Date().toISOString();
  const run: AutomationRunRecord = {
    id: createId('autorun'),
    sourceType: 'routine',
    sourceId: routine.id,
    sourceName: routine.name,
    task: routine.task,
    toolGatewayToolIds: routine.toolGatewayToolIds,
    status: 'pending_approval',
    approvalRequired: approvalRequired(),
    permissionProfile: routine.permissionProfile,
    triggerType: routine.triggerType,
    runMode: 'manual',
    createdAt: now,
    updatedAt: now,
  };
  run.report = createAutomationReport(run, ['Routine run created in approval-first mode.']);
  automationStorage.runs.save(run);
  automationStorage.history.append(createHistoryEntry('run', run.id, 'routine.run.created', { routineId: routine.id }));
  return run;
}

export function recordRoutineRun(routine: WorkLaneRoutine, run: AutomationRunRecord): WorkLaneRoutine {
  const updated = { ...routine, updatedAt: new Date().toISOString() };
  automationStorage.routines.save(updated);
  automationStorage.history.append(createHistoryEntry('routine', routine.id, 'routine.run.recorded', { runId: run.id }));
  return updated;
}
