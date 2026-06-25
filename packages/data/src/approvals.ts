import type { TaskRun, AuditEvent } from './types';

type RunStatus = TaskRun['status'];

const VALID_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  pending_approval: ['approved', 'cancelled'],
  approved: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
  draft: ['pending_approval'],
};

export function canTransition(from: RunStatus, to: RunStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionRun(
  run: TaskRun,
  newStatus: RunStatus,
  actorId: string
): { updatedRun: TaskRun; auditEvent: Omit<AuditEvent, 'id' | 'timestamp'> } | { error: string } {
  if (!canTransition(run.status, newStatus)) {
    return { error: `Invalid transition: ${run.status} → ${newStatus}` };
  }

  const updatedRun: TaskRun = {
    ...run,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (newStatus === 'approved') {
    updatedRun.approvalStatus = 'approved';
  }

  const auditEvent: Omit<AuditEvent, 'id' | 'timestamp'> = {
    workspaceId: run.workspaceId,
    actorId,
    actorType: 'user',
    action: `run.${newStatus}`,
    target: run.id,
    targetType: 'run',
    result: 'success',
    metadata: { from: run.status, to: newStatus },
  };

  return { updatedRun, auditEvent };
}
