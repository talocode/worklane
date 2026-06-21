import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok, badRequest } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const triggers = storage.triggers.list();
  return ok({ triggers });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return badRequest('name is required');
  }
  if (!body.agentId || typeof body.agentId !== 'string') {
    return badRequest('agentId is required');
  }
  if (!body.task || typeof body.task !== 'string') {
    return badRequest('task is required');
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
  return ok({ trigger });
}
