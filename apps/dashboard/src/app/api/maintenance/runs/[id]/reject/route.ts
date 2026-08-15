import { badRequest, notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { rejectMaintenanceRun } from '../../../../../../../../../packages/data/src/maintenance';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const body = await request.json().catch(() => ({}));
  try {
    const run = rejectMaintenanceRun(
      params.id,
      'user',
      typeof body.reason === 'string' ? body.reason : undefined,
    );
    if (!run) return notFound('Maintenance run not found');
    return ok({ run });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to reject maintenance run');
  }
}
