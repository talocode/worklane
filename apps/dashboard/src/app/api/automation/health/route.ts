import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { automationStorage } from '../../../../../../../packages/data/src/automation/storage';
import { loopConstraints } from '../../../../../../../packages/data/src/automation/loops';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({
    service: 'worklane-automation',
    version: '0.1',
    localFirst: true,
    approvalRequired: true,
    storage: automationStorage.paths,
    loopConstraints,
  });
}
