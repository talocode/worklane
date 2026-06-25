import { notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { rejectAutomationRun } from '../../../../../../../../../packages/data/src/automation/approvals';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const body = await request.json().catch(() => ({}));
  const run = rejectAutomationRun(params.id, 'user', typeof body.reason === 'string' ? body.reason : undefined);
  if (!run) return notFound('Automation approval run not found');
  return ok({ run });
}
