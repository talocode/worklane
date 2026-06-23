/**
 * Protocol execution bridge for WorkLane.
 * Bridges protocol action definitions to actual tool execution.
 */

import { WORKLANE_ACTIONS } from './actions';
import { WORKLANE_CONTEXT_PROVIDERS } from './context';
import { createAuditEvent, safeAuditMetadata } from './audit';
import { requiresApproval, requirePermission } from './permissions';
import { PROTOCOL_ERRORS } from './errors';
import type { AgentActionDefinition, AgentRun, AgentContextProvider } from './types';

export interface ProtocolRunInput {
  actionId: string;
  input: Record<string, unknown>;
  product?: string;
  grantedPermissions?: string[];
  approvedBy?: string;
}

export function resolveProtocolAction(actionId: string): AgentActionDefinition | undefined {
  return WORKLANE_ACTIONS.find((a) => a.id === actionId);
}

export function validateProtocolActionInput(
  action: AgentActionDefinition,
  input: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const schema = action.inputSchema as any;
  if (!schema || !schema.required) return { valid: true, errors: [] };

  for (const field of schema.required) {
    if (input[field] === undefined || input[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function canExecuteProtocolAction(
  action: AgentActionDefinition,
  grantedPermissions: string[],
  approvalStatus?: string
): { allowed: boolean; reason?: string } {
  if (action.riskLevel === 'destructive') {
    return { allowed: false, reason: 'Destructive actions are not supported' };
  }

  const { allowed, missing } = requirePermission(action.requiredPermissions, grantedPermissions);
  if (!allowed) {
    return { allowed: false, reason: `Missing permissions: ${missing.join(', ')}` };
  }

  if (action.requiresApproval && approvalStatus !== 'approved') {
    return { allowed: false, reason: 'Action requires approval before execution' };
  }

  return { allowed: true };
}

export function createProtocolRun(input: ProtocolRunInput): AgentRun {
  const action = resolveProtocolAction(input.actionId);
  if (!action) {
    throw new Error(PROTOCOL_ERRORS.ACTION_NOT_FOUND.message);
  }

  const lifecycle = action.readOnly ? 'executing' : 'pending_approval';

  return {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    product: action.product,
    actionId: input.actionId,
    lifecycle,
    input: input.input,
    approvalRequired: action.requiresApproval,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function formatProtocolActionResult(
  action: AgentActionDefinition,
  result: Record<string, unknown>
): Record<string, unknown> {
  return {
    actionId: action.id,
    actionType: action.type,
    product: action.product,
    readOnly: action.readOnly,
    result,
    timestamp: new Date().toISOString(),
  };
}

export function getContextProviders(): AgentContextProvider[] {
  return WORKLANE_CONTEXT_PROVIDERS;
}

export function getContextProvider(id: string): AgentContextProvider | undefined {
  return WORKLANE_CONTEXT_PROVIDERS.find((p) => p.id === id);
}
