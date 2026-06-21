import { NextResponse } from 'next/server';
import { storage } from '../../../../../../../../packages/data/src/storage';
import { transitionRun } from '../../../../../../../../packages/data/src/approvals';
import { ok, badRequest, notFound } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(_request);
  if (authError) return authError;

  const run = storage.runs.get(params.id);
  if (!run) {
    return notFound('Run not found');
  }

  const result = transitionRun(run, 'cancelled', 'user');
  if ('error' in result) {
    return badRequest(result.error);
  }

  storage.runs.update(params.id, result.updatedRun);
  storage.audit.create(result.auditEvent);

  return ok({ run: storage.runs.get(params.id) });
}
