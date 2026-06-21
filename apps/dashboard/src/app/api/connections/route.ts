import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';

export async function GET() {
  const conns = storage.connections.list().map(c => ({
    ...c,
    secretRef: '***',
  }));
  return NextResponse.json({ ok: true, connections: conns });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
  }
  if (!body.type || typeof body.type !== 'string') {
    return NextResponse.json({ ok: false, error: 'type is required' }, { status: 400 });
  }
  const conn = storage.connections.create({
    workspaceId: 'ws_default',
    name: body.name,
    type: body.type,
    status: 'inactive',
    config: body.config || {},
    createdBy: 'user',
  });
  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action: 'connection.created',
    target: conn.id,
    targetType: 'connection',
    result: 'success',
  });
  return NextResponse.json({ ok: true, connection: { ...conn, secretRef: '***' } });
}
