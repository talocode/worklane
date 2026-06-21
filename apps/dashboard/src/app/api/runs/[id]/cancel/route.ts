import { NextResponse } from 'next/server';
import { storage } from '../../../../../../../../packages/data/src/storage';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const run = storage.runs.get(params.id);
  if (!run) {
    return NextResponse.json({ ok: false, error: 'Run not found' }, { status: 404 });
  }

  storage.runs.update(params.id, { status: 'cancelled' });

  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action: 'run.cancelled',
    target: params.id,
    targetType: 'run',
    result: 'success',
  });

  return NextResponse.json({ ok: true, run: storage.runs.get(params.id) });
}
