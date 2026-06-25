import { NextResponse } from 'next/server';
import { storage } from '../../../../../../../../packages/data/src/storage';
import { transitionRun } from '../../../../../../../../packages/data/src/approvals';
import { executeToolRun, executeSimulated } from '../../../../../../../../packages/data/src/executor';
import { isReadOnlyAction } from '../../../../../../../../packages/data/src/tools/registry';
import { ok, badRequest, notFound } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const run = storage.runs.get(params.id);
  if (!run) {
    return notFound('Run not found');
  }

  const readOnly = run.toolAction ? isReadOnlyAction(run.toolAction) : false;

  if (!readOnly && run.approvalStatus !== 'approved') {
    return badRequest('Write actions must be approved before execution');
  }

  if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
    return badRequest(`Run is already in terminal status: ${run.status}`);
  }

  if (run.status !== 'approved' && run.status !== 'running') {
    const transitionResult = transitionRun(run, 'running', 'system');
    if ('error' in transitionResult) {
      return badRequest(transitionResult.error);
    }
    storage.runs.update(params.id, transitionResult.updatedRun);
    storage.audit.create(transitionResult.auditEvent);
  }

  const currentRun = storage.runs.get(params.id)!;

  let result: Awaited<ReturnType<typeof executeToolRun>> | Awaited<ReturnType<typeof executeSimulated>>;

  if (currentRun.executionMode === 'live' && currentRun.toolAction) {
    result = await executeToolRun(currentRun);
  } else {
    result = executeSimulated(currentRun);
  }

  if ('error' in result) {
    storage.runs.update(params.id, {
      status: 'failed',
      error: result.error,
      updatedAt: new Date().toISOString(),
    });
    storage.audit.create({
      workspaceId: currentRun.workspaceId,
      actorId: 'system',
      actorType: 'system',
      action: 'run.failed',
      target: currentRun.id,
      targetType: 'run',
      result: 'failure',
      metadata: { error: result.error },
    });
    return badRequest(result.error);
  }

  storage.runs.update(params.id, result.updatedRun);
  for (const auditEvent of result.auditEvents) {
    storage.audit.create(auditEvent);
  }

  const execution = currentRun.executionMode === 'live' && currentRun.toolAction
    ? {
        mode: readOnly ? 'read' : 'real',
        provider: 'github',
        action: currentRun.toolAction,
        result: result.updatedRun.result ? JSON.parse(result.updatedRun.result) : null,
      }
    : { mode: 'simulated' };

  return ok({ run: storage.runs.get(params.id), execution });
}
