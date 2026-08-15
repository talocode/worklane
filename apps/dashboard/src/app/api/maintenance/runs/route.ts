import { badRequest, ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import {
  createMaintenanceRun,
  isMaintenanceRoutineId,
  listMaintenanceRuns,
} from '../../../../../../../packages/data/src/maintenance';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ runs: listMaintenanceRuns() });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.routineId !== 'string' || !isMaintenanceRoutineId(body.routineId) || typeof body.repo !== 'string') {
    return badRequest('routineId and repo are required');
  }
  try {
    const run = createMaintenanceRun({
      routineId: body.routineId,
      repo: body.repo,
      baseRef: typeof body.baseRef === 'string' ? body.baseRef : undefined,
      maxFiles: typeof body.maxFiles === 'number' ? body.maxFiles : undefined,
      maxPatchLines: typeof body.maxPatchLines === 'number' ? body.maxPatchLines : undefined,
      maxRuntimeMinutes: typeof body.maxRuntimeMinutes === 'number' ? body.maxRuntimeMinutes : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    });
    return ok({ run });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to create maintenance run');
  }
}
