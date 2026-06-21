import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const actorType = url.searchParams.get('actorType') || undefined;
  const action = url.searchParams.get('action') || undefined;
  const events = storage.audit.list({ limit, actorType, action });
  return ok({ events });
}
