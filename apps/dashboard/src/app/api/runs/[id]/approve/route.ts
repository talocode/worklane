import { NextResponse } from 'next/server';
import { storage } from '../../../../../../../../packages/data/src/storage';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));

  const run = storage.runs.get(params.id);
  if (!run) {
    return NextResponse.json({ ok: false, error: 'Run not found' }, { status: 404 });
  }

  if (run.status !== 'pending_approval') {
    return NextResponse.json({ ok: false, error: 'Run is not pending approval' }, { status: 400 });
  }

  storage.runs.update(params.id, {
    status: 'running',
    approvalStatus: 'approved',
  });

  // Simulate execution
  setTimeout(() => {
    storage.runs.update(params.id, {
      status: 'completed',
      result: `Simulated execution completed for: ${run.task}`,
    });
    storage.audit.create({
      workspaceId: 'ws_default',
      actorId: 'user',
      actorType: 'user',
      action: 'run.approved',
      target: params.id,
      targetType: 'run',
      result: 'success',
      metadata: { notes: body.notes },
    });
  }, 500);

  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action: 'run.approved',
    target: params.id,
    targetType: 'run',
    result: 'success',
  });

  return NextResponse.json({ ok: true, run: storage.runs.get(params.id) });
}
