import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { toolGatewayStorage } from '../../../../../../../packages/data/src/tool-gateway/storage';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  toolGatewayStorage.ensureDefaults();

  return ok({
    service: 'worklane-tool-gateway',
    version: '0.1',
    storage: toolGatewayStorage.paths,
    approvalFirst: true,
  });
}
