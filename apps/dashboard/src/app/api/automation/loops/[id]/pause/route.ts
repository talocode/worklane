import { notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { pauseLoop } from '../../../../../../../../../packages/data/src/automation/loops';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const loop = pauseLoop(params.id);
  if (!loop) return notFound('Loop not found');
  return ok({ loop });
}
