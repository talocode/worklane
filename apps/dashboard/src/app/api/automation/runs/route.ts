import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { automationStorage } from '../../../../../../../packages/data/src/automation/storage';
import { runSchedulerTick } from '../../../../../../../packages/data/src/automation/scheduler';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  runSchedulerTick();
  return ok({ runs: automationStorage.runs.list() });
}
