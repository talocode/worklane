import { notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { markExecutionQueueItemManual } from '../../../../../../../../../packages/data/src/execution/queue';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const body = await request.json().catch(() => ({}));
  const item = markExecutionQueueItemManual(params.id, typeof body.reason === 'string' ? body.reason : undefined);
  if (!item) return notFound('Execution queue item not found');
  return ok({ item });
}
