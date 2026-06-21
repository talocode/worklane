import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';

export async function GET() {
  const triggers = storage.triggers.list();
  return NextResponse.json({ ok: true, triggers });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
  }
  if (!body.agentId || typeof body.agentId !== 'string') {
    return NextResponse.json({ ok: false, error: 'agentId is required' }, { status: 400 });
  }
  if (!body.task || typeof body.task !== 'string') {
    return NextResponse.json({ ok: false, error: 'task is required' }, { status: 400 });
  }
  const trigger = storage.triggers.create({
    workspaceId: 'ws_default',
    name: body.name,
    type: body.type || 'manual',
    agentId: body.agentId,
    task: body.task,
    schedule: body.schedule,
    enabled: true,
  });
  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action: 'trigger.created',
    target: trigger.id,
    targetType: 'trigger',
    result: 'success',
  });
  return NextResponse.json({ ok: true, trigger });
}
