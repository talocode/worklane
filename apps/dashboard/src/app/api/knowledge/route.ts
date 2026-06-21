import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok, badRequest } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const docs = storage.knowledge.list();
  return ok({ knowledge: docs });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json();
  if (!body.title || typeof body.title !== 'string') {
    return badRequest('title is required');
  }
  if (!body.content || typeof body.content !== 'string') {
    return badRequest('content is required');
  }
  const doc = storage.knowledge.create({
    workspaceId: 'ws_default',
    title: body.title,
    content: body.content,
    tags: body.tags || [],
    category: body.category || 'general',
    createdBy: 'user',
  });
  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action: 'knowledge.created',
    target: doc.id,
    targetType: 'knowledge',
    result: 'success',
  });
  return ok({ knowledge: doc });
}
