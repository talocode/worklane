import { badRequest, ok, serverError } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { createRoutine, listRoutines } from '../../../../../../../packages/data/src/automation/routines';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ routines: listRoutines() });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || typeof body.description !== 'string' || typeof body.task !== 'string') {
    return badRequest('name, description, and task are required');
  }
  try {
    const routine = createRoutine({
      name: body.name,
      description: body.description,
      task: body.task,
      triggerType: typeof body.triggerType === 'string' ? body.triggerType : undefined,
      toolGatewayToolIds: Array.isArray(body.toolGatewayToolIds) ? body.toolGatewayToolIds.filter((item: unknown) => typeof item === 'string') : [],
      permissionProfile: typeof body.permissionProfile === 'string' ? body.permissionProfile : undefined,
      schedule: body.schedule && typeof body.schedule === 'object' ? body.schedule : undefined,
    });
    return ok({ routine });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Failed to create routine');
  }
}
