import { ok } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';
import { listLoopStarters } from '../../../../../../packages/data/src/loop-starters';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ starters: listLoopStarters() });
}