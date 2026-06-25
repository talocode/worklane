import { badRequest, ok, serverError } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { createLoop, listLoops } from '../../../../../../../packages/data/src/automation/loops';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return ok({ loops: listLoops() });
}

export async function POST(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || typeof body.task !== 'string' || typeof body.intervalMinutes !== 'number') {
    return badRequest('name, task, and intervalMinutes are required');
  }
  try {
    const loop = createLoop({
      name: body.name,
      task: body.task,
      intervalMinutes: body.intervalMinutes,
      toolGatewayToolIds: Array.isArray(body.toolGatewayToolIds) ? body.toolGatewayToolIds.filter((item: unknown) => typeof item === 'string') : [],
      expiresAt: typeof body.expiresAt === 'string' ? body.expiresAt : undefined,
      permissionProfile: typeof body.permissionProfile === 'string' ? body.permissionProfile : undefined,
    });
    return ok({ loop });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Failed to create loop');
  }
}
