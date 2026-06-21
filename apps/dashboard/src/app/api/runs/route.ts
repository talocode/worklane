import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const runs = storage.runs.list();
  return ok({ runs });
}
