import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok, badRequest } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const conns = storage.connections.list().map(c => ({
    ...c,
    secretRef: '***',
  }));
  return ok({ connections: conns });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return badRequest('name is required');
  }
  if (!body.type || typeof body.type !== 'string') {
    return badRequest('type is required');
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
  return ok({ connection: { ...conn, secretRef: '***' } });
}
