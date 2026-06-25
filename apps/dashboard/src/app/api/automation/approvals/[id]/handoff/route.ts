import { badRequest, notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { handoffAutomationRun } from '../../../../../../../../../packages/data/src/automation/approvals';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const result = handoffAutomationRun(params.id);
  if (result.errors && !result.run) {
    const message = result.errors.join(' ');
    if (message.includes('not found')) return notFound(message);
    return badRequest(message);
  }
  return ok({ run: result.run, message: result.message, errors: result.errors || [] });
}
