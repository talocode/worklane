import { NextResponse } from "next/server";
import { WORKLANE_CONTEXT_PROVIDERS } from "../../../../../../packages/data/src/agentProtocol";

export async function GET() {
  return NextResponse.json({
    ok: true,
    contextProviders: WORKLANE_CONTEXT_PROVIDERS.map((p) => ({
      id: p.id,
      product: p.product,
      title: p.title,
      description: p.description,
      provides: p.provides,
      privacyLevel: p.privacyLevel,
    })),
  });
}
