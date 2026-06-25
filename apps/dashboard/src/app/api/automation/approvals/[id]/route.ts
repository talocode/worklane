import { notFound, ok } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { automationStorage } from '../../../../../../../../packages/data/src/automation/storage';
import { getAutomationRunApprovalSummary, normalizeApprovalFields } from '../../../../../../../../packages/data/src/automation/approvals';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const run = automationStorage.runs.get(params.id);
  if (!run) return notFound('Automation approval run not found');
  return ok({ run: getAutomationRunApprovalSummary(normalizeApprovalFields(run)) });
}
