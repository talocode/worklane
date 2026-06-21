import type { TaskRun, AuditEvent } from './types';
import { executeToolAction } from './tools/executor';

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

export async function executeToolRun(run: TaskRun): Promise<{
  updatedRun: TaskRun;
  auditEvents: Omit<AuditEvent, 'id' | 'timestamp'>[];
} | { error: string }> {
  if (run.approvalStatus !== 'approved') {
    return { error: 'Run must be approved before execution' };
  }

  if (run.executionMode !== 'live') {
    return { error: 'Tool execution requires executionMode "live"' };
  }

  if (!run.toolAction) {
    return { error: 'No tool action specified for this run' };
  }

  const auditEvents: Omit<AuditEvent, 'id' | 'timestamp'>[] = [];

  auditEvents.push({
    workspaceId: run.workspaceId,
    actorId: run.agentId,
    actorType: 'agent',
    action: 'tool.execution.started',
    target: run.id,
    targetType: 'run',
    result: 'pending',
    metadata: { action: run.toolAction, mode: 'real' },
  });

  const result = await executeToolAction(run.toolAction as any, run.toolInput || {});

  if (!result.ok) {
    const failedRun: TaskRun = {
      ...run,
      status: 'failed',
      error: result.error,
      updatedAt: new Date().toISOString(),
    };

    auditEvents.push({
      workspaceId: run.workspaceId,
      actorId: run.agentId,
      actorType: 'agent',
      action: 'tool.execution.failed',
      target: run.id,
      targetType: 'run',
      result: 'failure',
      metadata: { action: run.toolAction, error: result.error },
    });

    return { updatedRun: failedRun, auditEvents };
  }

  const completedRun: TaskRun = {
    ...run,
    status: 'completed',
    result: JSON.stringify(result.execution.result),
    updatedAt: new Date().toISOString(),
  };

  auditEvents.push({
    workspaceId: run.workspaceId,
    actorId: run.agentId,
    actorType: 'agent',
    action: 'tool.execution.completed',
    target: run.id,
    targetType: 'run',
    result: 'success',
    metadata: {
      action: run.toolAction,
      mode: 'real',
      provider: result.execution.provider,
      resultSummary: `Created issue #${(result.execution.result as any).issueNumber}`,
    },
  });

  return { updatedRun: completedRun, auditEvents };
}
