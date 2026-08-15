import { badRequest, notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { approveMaintenanceRun } from '../../../../../../../../../packages/data/src/maintenance';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const run = approveMaintenanceRun(params.id, 'user');
    if (!run) return notFound('Maintenance run not found');
    return ok({ run });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to approve maintenance run');
  }
}
