import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { listGatewayTools } from '../../../../../../../packages/data/src/tool-gateway/registry';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ tools: listGatewayTools() });
}
