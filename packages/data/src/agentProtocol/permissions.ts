/**
 * Permission gates for WorkLane agent actions.
 */

export const PERMISSION_DEFINITIONS = [
  { id: 'github:read', title: 'Read GitHub data', description: 'List and view issues, comments, repositories' },
  { id: 'github:write', title: 'Write GitHub data', description: 'Create issues, post comments' },
  { id: 'worklane:agents', title: 'Manage agents', description: 'Create, update, delete agents' },
  { id: 'worklane:knowledge', title: 'Manage knowledge', description: 'Add, edit, delete knowledge documents' },
  { id: 'worklane:connections', title: 'Manage connections', description: 'Configure tool connections' },
  { id: 'worklane:runs', title: 'Manage runs', description: 'Approve, cancel task runs' },
  { id: 'worklane:audit', title: 'View audit', description: 'Read audit trail' },
];

export function requirePermission(actionPermissions: string[], userPermissions: string[]): { allowed: boolean; missing: string[] } {
  const missing = actionPermissions.filter((p) => !userPermissions.includes(p));
  return { allowed: missing.length === 0, missing };
}

export function requiresApproval(riskLevel: string): boolean {
  return riskLevel !== 'read';
}
