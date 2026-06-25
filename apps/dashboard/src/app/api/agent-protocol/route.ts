import { NextResponse } from "next/server";
import { WORKLANE_ACTIONS, WORKLANE_CONTEXT_PROVIDERS, PERMISSION_DEFINITIONS } from "../../../../../../packages/data/src/agentProtocol";

export async function GET() {
  return NextResponse.json({
    ok: true,
    protocol: {
      name: "Talocode Agent-Native Protocol",
      version: "0.1.0",
      product: "worklane",
      actions: WORKLANE_ACTIONS,
      contextProviders: WORKLANE_CONTEXT_PROVIDERS,
      permissions: PERMISSION_DEFINITIONS.map((p) => p.id),
      runLifecycle: ["draft", "context_gathering", "planning", "pending_approval", "approved", "executing", "completed", "failed", "cancelled"],
    },
  });
}
