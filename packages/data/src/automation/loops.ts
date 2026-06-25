import { automationStorage } from './storage';
import { approvalRequired, defaultPermissionProfile, permissionProfileRules, validateToolPermissions } from './permissions';
import { createHistoryEntry } from './history';
import type { AutomationRunRecord, LoopInput, WorkLaneLoop } from './types';

const DEFAULT_EXPIRY_DAYS = 7;
const MIN_INTERVAL_MINUTES = 1;
const MAX_ACTIVE_LOOPS = 50;

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeNextRunAt(from: Date | string, intervalMinutes: number): string {
  const base = typeof from === 'string' ? new Date(from) : from;
  return new Date(base.getTime() + intervalMinutes * 60 * 1000).toISOString();
}

export function createLoop(input: LoopInput): WorkLaneLoop {
  if (input.intervalMinutes < MIN_INTERVAL_MINUTES) {
    throw new Error('Loop interval must be at least 1 minute.');
  }

  const activeLoops = automationStorage.loops.list().filter((loop) => loop.status === 'active');
  if (activeLoops.length >= MAX_ACTIVE_LOOPS) {
    throw new Error('Maximum active loops reached.');
  }

  const toolIds = input.toolGatewayToolIds || [];
  const permissions = validateToolPermissions(toolIds);
  if (!permissions.valid) {
    throw new Error(permissions.reasons.join(' '));
  }

  const createdAt = new Date().toISOString();
  const expiresAt = input.expiresAt || new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const loop: WorkLaneLoop = {
    id: createId('loop'),
    name: input.name,
    task: input.task,
    toolGatewayToolIds: toolIds,
    triggerType: 'schedule',
    intervalMinutes: input.intervalMinutes,
    status: 'active',
    approvalRequired: approvalRequired(),
    permissionProfile: input.permissionProfile || defaultPermissionProfile(),
    expiresAt,
    nextRunAt: computeNextRunAt(createdAt, input.intervalMinutes),
    createdAt,
    updatedAt: createdAt,
  };

  automationStorage.loops.save(loop);
  automationStorage.history.append(createHistoryEntry('loop', loop.id, 'loop.created', { rules: permissionProfileRules(loop.permissionProfile) }));
  return loop;
}

export function listLoops(): WorkLaneLoop[] {
  return automationStorage.loops.list();
}

export function getLoop(id: string): WorkLaneLoop | undefined {
  return automationStorage.loops.get(id);
}

export function pauseLoop(id: string): WorkLaneLoop | null {
  const loop = getLoop(id);
  if (!loop) return null;
  const updated = { ...loop, status: 'paused' as const, updatedAt: new Date().toISOString() };
  automationStorage.loops.save(updated);
  automationStorage.history.append(createHistoryEntry('loop', id, 'loop.paused'));
  return updated;
}

export function resumeLoop(id: string): WorkLaneLoop | null {
  const loop = getLoop(id);
  if (!loop) return null;
  const updated = {
    ...loop,
    status: 'active' as const,
    nextRunAt: computeNextRunAt(new Date(), loop.intervalMinutes),
    updatedAt: new Date().toISOString(),
  };
  automationStorage.loops.save(updated);
  automationStorage.history.append(createHistoryEntry('loop', id, 'loop.resumed'));
  return updated;
}

export function cancelLoop(id: string): WorkLaneLoop | null {
  const loop = getLoop(id);
  if (!loop) return null;
  const updated = { ...loop, status: 'cancelled' as const, updatedAt: new Date().toISOString() };
  automationStorage.loops.save(updated);
  automationStorage.history.append(createHistoryEntry('loop', id, 'loop.cancelled'));
  return updated;
}

export function recordLoopRun(loop: WorkLaneLoop, run: AutomationRunRecord): WorkLaneLoop {
  const updated = {
    ...loop,
    lastRunAt: run.createdAt,
    nextRunAt: computeNextRunAt(run.createdAt, loop.intervalMinutes),
    updatedAt: new Date().toISOString(),
  };
  automationStorage.loops.save(updated);
  automationStorage.history.append(createHistoryEntry('loop', loop.id, 'loop.run.recorded', { runId: run.id }));
  return updated;
}

export const loopConstraints = {
  DEFAULT_EXPIRY_DAYS,
  MIN_INTERVAL_MINUTES,
  MAX_ACTIVE_LOOPS,
};
