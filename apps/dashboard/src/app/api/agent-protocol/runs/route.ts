import { NextResponse } from "next/server";
import { resolveProtocolAction, validateProtocolActionInput, createProtocolRun } from "../../../../../../../packages/data/src/agentProtocol";

const protocolRuns: Map<string, any> = new Map();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.actionId || !body.input) {
    return NextResponse.json({ ok: false, error: "actionId and input are required" }, { status: 400 });
  }

  const action = resolveProtocolAction(body.actionId);
  if (!action) {
    return NextResponse.json({ ok: false, error: "Action not found in protocol registry" }, { status: 404 });
  }

  const validation = validateProtocolActionInput(action, body.input);
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: "Invalid input", details: validation.errors }, { status: 400 });
  }

  const run = createProtocolRun({ actionId: body.actionId, input: body.input });
  protocolRuns.set(run.id, run);

  return NextResponse.json({
    ok: true,
    run: {
      id: run.id,
      actionId: run.actionId,
      lifecycle: run.lifecycle,
      approvalRequired: run.approvalRequired,
      readOnly: action.readOnly,
      createdAt: run.createdAt,
    },
  }, { status: 201 });
}
