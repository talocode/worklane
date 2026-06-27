import { badRequest, notFound, ok, serverError } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { getLoopStarter, instantiateLoopStarter } from '../../../../../../../../packages/data/src/loop-starters';
import type { WorkLaneLoopStarterMode } from '../../../../../../../../packages/data/src/loop-starters/types';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const starter = getLoopStarter(params.id);
  if (!starter) return notFound('Loop starter not found');

  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || typeof body.repo !== 'string' || typeof body.cadence !== 'string') {
    return badRequest('title, repo, and cadence are required');
  }

  const mode: WorkLaneLoopStarterMode =
    body.mode === 'approval_required' || body.mode === 'report_only'
      ? body.mode
      : starter.defaultMode;

  try {
    const result = instantiateLoopStarter(params.id, {
      title: body.title,
      repo: body.repo,
      cadence: body.cadence,
      toolIds: Array.isArray(body.toolIds)
        ? body.toolIds.filter((item: unknown) => typeof item === 'string')
        : starter.requiredTools,
      mode,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    });
    return ok({ ...result });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Failed to instantiate loop starter');
  }
}