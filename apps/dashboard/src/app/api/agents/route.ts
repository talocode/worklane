import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';

export async function GET() {
  const agents = storage.agents.list();
  return NextResponse.json({ ok: true, agents });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
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
  return NextResponse.json({ ok: true, agent });
}
