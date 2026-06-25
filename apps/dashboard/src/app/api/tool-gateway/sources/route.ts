import { badRequest, ok, serverError } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { sourceConfigSummary } from '../../../../../../../packages/data/src/tool-gateway/sources';
import { toolGatewayStorage } from '../../../../../../../packages/data/src/tool-gateway/storage';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const sources = toolGatewayStorage.listSources().map((source) => ({
    ...source,
    configStatus: sourceConfigSummary(source),
  }));
  return ok({ sources });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || typeof body.type !== 'string') {
    return badRequest('name and type are required');
  }

  try {
    const source = toolGatewayStorage.createSource({
      name: body.name,
      type: body.type,
      enabled: body.enabled !== false,
      baseUrl: typeof body.baseUrl === 'string' ? body.baseUrl : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      auth: body.auth && typeof body.auth.type === 'string'
        ? { type: body.auth.type, envKeyName: typeof body.auth.envKeyName === 'string' ? body.auth.envKeyName : undefined }
        : undefined,
    });
    return ok({ source: { ...source, configStatus: sourceConfigSummary(source) } });
  } catch {
    return serverError('Failed to create tool source');
  }
}
