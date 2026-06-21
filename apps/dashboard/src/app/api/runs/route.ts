import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';

export async function GET() {
  const runs = storage.runs.list();
  return NextResponse.json({ ok: true, runs });
}
