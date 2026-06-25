import { badRequest, ok, serverError } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { normalizeManualTool } from '../../../../../../../../packages/data/src/tool-gateway/normalize';
import { toolGatewayStorage } from '../../../../../../../../packages/data/src/tool-gateway/storage';

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.sourceId !== 'string' || typeof body.name !== 'string' || typeof body.displayName !== 'string' || typeof body.description !== 'string' || typeof body.riskLevel !== 'string') {
    return badRequest('sourceId, name, displayName, description, and riskLevel are required');
  }

  if (!toolGatewayStorage.getSource(body.sourceId)) {
    return badRequest('sourceId does not exist');
  }

  try {
    const normalized = normalizeManualTool({
      sourceId: body.sourceId,
      name: body.name,
      displayName: body.displayName,
      description: body.description,
      inputSchema: body.inputSchema && typeof body.inputSchema === 'object' ? body.inputSchema : {},
      outputSchema: body.outputSchema && typeof body.outputSchema === 'object' ? body.outputSchema : undefined,
      riskLevel: body.riskLevel,
      requiresApproval: typeof body.requiresApproval === 'boolean' ? body.requiresApproval : undefined,
      enabled: body.enabled !== false,
      tags: Array.isArray(body.tags) ? body.tags.filter((item: unknown) => typeof item === 'string') : [],
    });
    const tool = toolGatewayStorage.registerTool(normalized);
    return ok({ tool });
  } catch {
    return serverError('Failed to register tool');
  }
}
