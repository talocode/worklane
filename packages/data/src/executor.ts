import type { TaskRun, AuditEvent } from './types';

export function executeSimulated(run: TaskRun): {
  updatedRun: TaskRun;
  auditEvents: Omit<AuditEvent, 'id' | 'timestamp'>[];
} | { error: string } {
  if (run.approvalStatus !== 'approved') {
    return { error: 'Run must be approved before execution' };
  }

  if (run.executionMode !== 'simulated') {
    return { error: 'Only simulated execution is supported in v0.1' };
  }

  const auditEvents: Omit<AuditEvent, 'id' | 'timestamp'>[] = [];

  const updatedSteps = run.plan.map((step) => {
    auditEvents.push({
      workspaceId: run.workspaceId,
      actorId: run.agentId,
      actorType: 'agent',
      action: 'step.completed',
      target: step.id,
      targetType: 'step',
      result: 'success',
      metadata: { simulated: true, description: step.description },
    });

    return {
      ...step,
      status: 'completed' as const,
      result: `[Simulated] Completed: ${step.description}`,
    };
  });

  const updatedRun: TaskRun = {
    ...run,
    status: 'completed',
    plan: updatedSteps,
    result: `Simulated execution completed for: ${run.task}`,
    updatedAt: new Date().toISOString(),
  };

  auditEvents.push({
    workspaceId: run.workspaceId,
    actorId: run.agentId,
    actorType: 'agent',
    action: 'run.completed',
    target: run.id,
    targetType: 'run',
    result: 'success',
    metadata: { simulated: true },
  });

  return { updatedRun, auditEvents };
}
