import { notFound, ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { getLoopStarter } from '../../../../../../../packages/data/src/loop-starters';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const starter = getLoopStarter(params.id);
  if (!starter) return notFound('Loop starter not found');
  return ok({ starter });
}