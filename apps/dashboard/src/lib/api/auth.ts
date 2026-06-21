import { unauthorized, forbidden } from './response';
import { NextResponse } from 'next/server';

const DEV_TOKEN = process.env.WORKLANE_DEV_TOKEN || '';

export function checkAuth(request: Request): NextResponse | null {
  if (!DEV_TOKEN) return null;

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return unauthorized('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  if (token !== DEV_TOKEN) {
    return forbidden('Invalid token');
  }

  return null;
}
