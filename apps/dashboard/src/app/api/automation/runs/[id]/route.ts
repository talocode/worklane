import { notFound, ok } from '../../../../../lib/api/response';
import { checkAuth } from '../../../../../lib/api/auth';
import { automationStorage } from '../../../../../../../../packages/data/src/automation/storage';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const run = automationStorage.runs.get(params.id);
  if (!run) return notFound('Automation run not found');
  return ok({ run });
}
