import { automationStorage } from './storage';
import { createHistoryEntry } from './history';
import { approvalRequired } from './permissions';
import { computeNextRunAt, recordLoopRun } from './loops';
import { createAutomationReport } from './reporter';
import type { AutomationRunRecord, WorkLaneLoop } from './types';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createLoopRun(loop: WorkLaneLoop, scheduledFor: string): AutomationRunRecord {
  const now = new Date().toISOString();
  const run: AutomationRunRecord = {
    id: createId('autorun'),
    sourceType: 'loop',
    sourceId: loop.id,
    sourceName: loop.name,
    task: loop.task,
    toolGatewayToolIds: loop.toolGatewayToolIds,
    status: 'pending_approval',
    approvalRequired: approvalRequired(),
    permissionProfile: loop.permissionProfile,
    triggerType: 'schedule',
    runMode: 'scheduler',
    scheduledFor,
    approvalStatus: 'pending',
    handoffStatus: 'not_started',
    createdAt: now,
    updatedAt: now,
  };
  run.report = createAutomationReport(run, ['Loop scheduler created a pending approval run.']);
  return run;
}

export function runSchedulerTick(now = new Date()): AutomationRunRecord[] {
  const loops = automationStorage.loops.list();
  const createdRuns: AutomationRunRecord[] = [];

  for (const loop of loops) {
    if (loop.status !== 'active') continue;
    if (new Date(loop.expiresAt).getTime() <= now.getTime()) {
      automationStorage.loops.save({ ...loop, status: 'expired', updatedAt: new Date().toISOString() });
      continue;
    }

    const nextRunAt = new Date(loop.nextRunAt);
    if (nextRunAt.getTime() > now.getTime()) continue;

    const existingPending = automationStorage.runs.list().some((run) => run.sourceType === 'loop' && run.sourceId === loop.id && ['pending_approval', 'approved', 'running'].includes(run.status));
    if (existingPending) continue;

    const scheduledFor = nextRunAt.toISOString();
    const run = createLoopRun(loop, scheduledFor);
    automationStorage.runs.save(run);
    createdRuns.push(run);

    const updatedLoop = recordLoopRun({
      ...loop,
      lastCatchUpAt: loop.lastRunAt && new Date(loop.lastRunAt).getTime() < nextRunAt.getTime() ? now.toISOString() : loop.lastCatchUpAt,
    }, run);
    automationStorage.loops.save({ ...updatedLoop, nextRunAt: computeNextRunAt(now, loop.intervalMinutes) });
    automationStorage.history.append(createHistoryEntry('run', run.id, 'scheduler.run.created', { loopId: loop.id }));
  }

  return createdRuns;
}
