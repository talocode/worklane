import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const actorType = url.searchParams.get('actorType') || undefined;
  const action = url.searchParams.get('action') || undefined;

  const events = storage.audit.list({ limit, actorType, action });
  return NextResponse.json({ ok: true, events });
}
