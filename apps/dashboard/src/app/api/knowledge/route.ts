import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';

export async function GET() {
  const docs = storage.knowledge.list();
  return NextResponse.json({ ok: true, knowledge: docs });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 });
  }
  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ ok: false, error: 'content is required' }, { status: 400 });
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
  return NextResponse.json({ ok: true, knowledge: doc });
}
