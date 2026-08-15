import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { listMaintenanceRoutines } from '../../../../../../../packages/data/src/maintenance';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ routines: listMaintenanceRoutines() });
}
