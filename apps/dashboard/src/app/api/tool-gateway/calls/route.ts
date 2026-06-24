import { badRequest, ok, serverError } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { storage } from '../../../../../../../packages/data/src/storage';
import { createGatewayCall } from '../../../../../../../packages/data/src/tool-gateway/executor';
import { toolGatewayStorage } from '../../../../../../../packages/data/src/tool-gateway/storage';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ calls: toolGatewayStorage.listCalls() });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.toolId !== 'string') {
    return badRequest('toolId is required');
  }

  const result = createGatewayCall(body.toolId, body.input && typeof body.input === 'object' ? body.input : {});
  if (result.error) return badRequest(result.error);

  try {
    if (result.audit) {
      storage.audit.create(result.audit);
    }
    return ok({ call: result.call });
  } catch {
    return serverError('Failed to create tool call');
  }
}
