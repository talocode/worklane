import { NextResponse } from 'next/server';
import { listToolActions } from '../../../../../../../packages/data/src/tools';
import { ok } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const actions = listToolActions();
  return ok({ actions });
}
