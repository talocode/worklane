import { notFound, ok } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { getLoop } from '../../../../../../../../packages/data/src/automation/loops';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const loop = getLoop(params.id);
  if (!loop) return notFound('Loop not found');
  return ok({ loop });
}
