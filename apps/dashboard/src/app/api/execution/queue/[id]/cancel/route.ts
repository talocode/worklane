import { notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { cancelExecutionQueueItem } from '../../../../../../../../../packages/data/src/execution/queue';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const item = cancelExecutionQueueItem(params.id);
  if (!item) return notFound('Execution queue item not found or not cancellable');
  return ok({ item });
}
