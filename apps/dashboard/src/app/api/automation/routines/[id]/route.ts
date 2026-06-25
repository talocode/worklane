import { notFound, ok } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { getRoutine } from '../../../../../../../../packages/data/src/automation/routines';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const routine = getRoutine(params.id);
  if (!routine) return notFound('Routine not found');
  return ok({ routine });
}
