import { badRequest, notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { approveAutomationRun } from '../../../../../../../../../packages/data/src/automation/approvals';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const run = approveAutomationRun(params.id, 'user');
    if (!run) return notFound('Automation approval run not found');
    return ok({ run });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to approve automation run');
  }
}
