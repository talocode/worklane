import { notFound, ok } from '../../../../../../lib/api/response';
import { checkAuth } from '../../../../../../lib/api/auth';
import { getMaintenanceReport } from '../../../../../../../../../packages/data/src/maintenance';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  const report = getMaintenanceReport(params.id);
  if (!report) return notFound('Maintenance report not found');
  return ok({ report });
}
