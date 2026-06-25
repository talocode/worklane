import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { executionStorage } from '../../../../../../../packages/data/src/execution/storage';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({
    service: 'worklane-execution-queue',
    version: '0.1',
    approvalRequired: true,
    storage: executionStorage.paths,
  });
}
