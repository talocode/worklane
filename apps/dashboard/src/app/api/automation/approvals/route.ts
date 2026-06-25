import { ok } from '../../../../lib/api/response';
import { checkAuth } from '../../../../lib/api/auth';
import { getAutomationRunApprovalSummary, listPendingAutomationRuns } from '../../../../../../../packages/data/src/automation/approvals';

export async function GET(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const runs = listPendingAutomationRuns().map(getAutomationRunApprovalSummary);
  return ok({ runs });
}
