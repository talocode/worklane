import { NextResponse } from "next/server";
import { resolveProtocolAction, formatProtocolActionResult } from "../../../../../../../../packages/data/src/agentProtocol";

const protocolRuns: Map<string, any> = new Map();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const run = protocolRuns.get(params.id);
  if (!run) {
    return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });
  }

  if (run.lifecycle === 'completed' || run.lifecycle === 'failed' || run.lifecycle === 'cancelled') {
    return NextResponse.json({ ok: false, error: "Run is in a terminal state" }, { status: 400 });
  }

  if (!run.readOnly && run.lifecycle !== 'approved') {
    return NextResponse.json({ ok: false, error: "Write action must be approved before execution" }, { status: 403 });
  }

  const action = resolveProtocolAction(run.actionId);
  if (!action) {
    return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });
  }

  run.lifecycle = 'executing';
  run.updatedAt = new Date().toISOString();
  protocolRuns.set(params.id, run);

  const result = formatProtocolActionResult(action, { status: "executed", input: run.input });

  run.lifecycle = 'completed';
  run.output = result;
  run.updatedAt = new Date().toISOString();
  protocolRuns.set(params.id, run);

  return NextResponse.json({ ok: true, run: { id: run.id, lifecycle: run.lifecycle, output: result } });
}
