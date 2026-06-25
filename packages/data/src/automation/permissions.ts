import { getGatewayTool, listGatewaySources } from '../tool-gateway/registry';
import { evaluateToolPermission } from '../tool-gateway/permissions';
import type { PermissionProfile } from './types';

export function defaultPermissionProfile(): PermissionProfile {
  return 'approval_required';
}

export function approvalRequired(): true {
  return true;
}

export function validateToolPermissions(toolIds: string[]): { valid: boolean; reasons: string[] } {
  const sources = listGatewaySources();
  const reasons: string[] = [];

  for (const toolId of toolIds) {
    const tool = getGatewayTool(toolId);
    const source = tool ? sources.find((item) => item.id === tool.sourceId) : undefined;
    const permission = evaluateToolPermission(source, tool);
    if (!permission.allowed) reasons.push(permission.reason || `Tool ${toolId} is not allowed.`);
  }

  return { valid: reasons.length === 0, reasons };
}

export function permissionProfileRules(profile: PermissionProfile): string[] {
  switch (profile) {
    case 'read_only':
      return ['Read-oriented tool usage only.', 'Approval is still required before execution.'];
    case 'draft_only':
      return ['Draft outputs only.', 'No publish or send actions.'];
    case 'manual_only':
      return ['Manual execution only.', 'No scheduler execution.'];
    case 'approval_required':
    default:
      return ['Approval is required for every run.', 'Write, destructive, and external actions must remain approval-first.'];
  }
}
