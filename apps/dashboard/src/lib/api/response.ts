import { NextResponse } from 'next/server';

export function ok(data: Record<string, unknown>): NextResponse {
  return NextResponse.json({ ok: true, ...data });
}

export function badRequest(message: string, details?: string): NextResponse {
  return NextResponse.json({ ok: false, error: message, details }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error'): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
