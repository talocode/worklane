import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok, badRequest } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const agents = storage.agents.list();
  return ok({ agents });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return badRequest('name is required');
  }
  const agent = storage.agents.create({
    workspaceId: 'ws_default',
    name: body.name,
    description: body.description || '',
    skills: body.skills || [],
    systemPrompt: body.systemPrompt,
    model: body.model,
    status: 'active',
  });
  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action: 'agent.created',
    target: agent.id,
    targetType: 'agent',
    result: 'success',
  });
  return ok({ agent });
}
