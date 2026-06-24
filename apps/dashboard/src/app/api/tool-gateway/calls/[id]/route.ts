import { notFound, ok } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { toolGatewayStorage } from '../../../../../../../../packages/data/src/tool-gateway/storage';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const call = toolGatewayStorage.getCall(params.id);
  if (!call) return notFound('Tool call not found');
  return ok({ call });
}
