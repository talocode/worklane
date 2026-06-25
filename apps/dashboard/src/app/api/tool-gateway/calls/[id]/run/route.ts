import { badRequest, notFound, ok, serverError } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { storage } from '../../../../../../../../../packages/data/src/storage';
import { runGatewayCall } from '../../../../../../../../../packages/data/src/tool-gateway/executor';
import { toolGatewayStorage } from '../../../../../../../../../packages/data/src/tool-gateway/storage';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const existing = toolGatewayStorage.getCall(params.id);
  if (!existing) return notFound('Tool call not found');

  const result = runGatewayCall(params.id);
  if (result.error) return badRequest(result.error);

  try {
    if (result.audit) {
      storage.audit.create(result.audit);
    }
    return ok({ call: result.call });
  } catch {
    return serverError('Failed to run tool call');
  }
}
