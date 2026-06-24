import { sourceConfigSignal } from './sources';
import type { ToolGatewaySource, ToolGatewayTool, ToolPermissionResult } from './types';

export function evaluateToolPermission(source: ToolGatewaySource | undefined, tool: ToolGatewayTool | undefined): ToolPermissionResult {
  if (!source) return { allowed: false, approvalRequired: true, reason: 'Source not found.' };
  if (!tool) return { allowed: false, approvalRequired: true, reason: 'Tool not found.' };
  if (!source.enabled) return { allowed: false, approvalRequired: true, reason: 'Source is disabled.' };
  if (!tool.enabled) return { allowed: false, approvalRequired: true, reason: 'Tool is disabled.' };

  const configSignal = sourceConfigSignal(source);
  if (configSignal === 'missing_env' && source.type !== 'talocode' && source.type !== 'local') {
    return { allowed: false, approvalRequired: true, reason: 'Required auth environment variable is missing.' };
  }

  if (tool.riskLevel === 'read') {
    return { allowed: true, approvalRequired: false };
  }

  return {
    allowed: true,
    approvalRequired: true,
    reason: tool.requiresApproval ? 'Approval required before execution.' : undefined,
  };
}
