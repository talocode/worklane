import { badRequest, notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { runExecutionQueueItem } from '../../../../../../../../../packages/data/src/execution/queue';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const result = runExecutionQueueItem(params.id);
  if (result.error && !result.item) {
    if (result.error.includes('not found')) return notFound(result.error);
    return badRequest(result.error);
  }
  if (result.error) return badRequest(result.error);
  return ok({ item: result.item });
}
