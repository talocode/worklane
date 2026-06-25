import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { getExecutionSummary, listExecutionQueue } from '../../../../../../../packages/data/src/execution/queue';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ items: listExecutionQueue().map(getExecutionSummary) });
}
