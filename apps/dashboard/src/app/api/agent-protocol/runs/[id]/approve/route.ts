import { NextResponse } from "next/server";

const protocolRuns: Map<string, any> = new Map();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const run = protocolRuns.get(params.id);
  if (!run) {
    return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });
  }

  if (run.lifecycle !== 'pending_approval') {
    return NextResponse.json({ ok: false, error: "Run is not pending approval" }, { status: 400 });
  }

  run.lifecycle = 'approved';
  run.approvedBy = 'dashboard-user';
  run.updatedAt = new Date().toISOString();
  protocolRuns.set(params.id, run);

  return NextResponse.json({ ok: true, run: { id: run.id, lifecycle: run.lifecycle } });
}
