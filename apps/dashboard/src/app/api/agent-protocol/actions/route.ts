import { NextResponse } from "next/server";
import { WORKLANE_ACTIONS } from "../../../../../../../packages/data/src/agentProtocol";

export async function GET() {
  return NextResponse.json({
    ok: true,
    actions: WORKLANE_ACTIONS.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      riskLevel: a.riskLevel,
      readOnly: a.readOnly,
      requiresApproval: a.requiresApproval,
      requiredPermissions: a.requiredPermissions,
    })),
  });
}
