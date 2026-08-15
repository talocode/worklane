import { notFound, ok } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { getMaintenanceRun } from '../../../../../../../../packages/data/src/maintenance';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const run = getMaintenanceRun(params.id);
  if (!run) return notFound('Maintenance run not found');
  return ok({ run });
}
