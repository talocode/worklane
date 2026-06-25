import { storage } from '../storage';
import { createGatewayCall } from '../tool-gateway/executor';
import { getGatewayTool, listGatewaySources } from '../tool-gateway/registry';
import { evaluateToolPermission } from '../tool-gateway/permissions';
import { automationStorage } from './storage';
import { createHistoryEntry } from './history';
import type { AutomationRunRecord } from './types';

function sanitizeReason(reason?: string): string | undefined {
  if (!reason) return undefined;
  return reason.slice(0, 300);
}

function updateRun(run: AutomationRunRecord, patch: Partial<AutomationRunRecord>): AutomationRunRecord {
  const updated = { ...run, ...patch, updatedAt: new Date().toISOString() };
  automationStorage.runs.save(updated);
  return updated;
}

function audit(action: string, run: AutomationRunRecord, result: 'success' | 'failure' | 'pending', metadata?: Record<string, unknown>) {
  return storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action,
    target: run.id,
    targetType: 'automation_run',
    result,
    metadata,
  });
}

export function normalizeApprovalFields(run: AutomationRunRecord): AutomationRunRecord {
  return {
    ...run,
    approvalStatus: run.approvalStatus || (run.status === 'approved' ? 'approved' : 'pending'),
    handoffStatus: run.handoffStatus || 'not_started',
  };
}

export function listPendingAutomationRuns(): AutomationRunRecord[] {
  return automationStorage.runs.list().map(normalizeApprovalFields).filter((run) => run.approvalStatus === 'pending' || run.approvalStatus === 'approved' || run.approvalStatus === 'rejected');
}

export function getAutomationRunApprovalSummary(run: AutomationRunRecord) {
  const normalized = normalizeApprovalFields(run);
  return {
    id: normalized.id,
    sourceType: normalized.sourceType,
    sourceName: normalized.sourceName,
    task: normalized.task,
    triggerType: normalized.triggerType,
    approvalStatus: normalized.approvalStatus,
    approvedAt: normalized.approvedAt,
    approvedBy: normalized.approvedBy,
    rejectedAt: normalized.rejectedAt,
    rejectedBy: normalized.rejectedBy,
    rejectionReason: normalized.rejectionReason,
    permissionProfile: normalized.permissionProfile,
    toolGatewayToolIds: normalized.toolGatewayToolIds,
    handoffStatus: normalized.handoffStatus || 'not_started',
    handoffTarget: normalized.handoffTarget,
    warnings: normalized.toolGatewayToolIds.length === 0 ? ['No Tool Gateway tool referenced. Manual handoff required.'] : [],
  };
}

export function approveAutomationRun(id: string, approvedBy = 'user'): AutomationRunRecord | null {
  const existing = automationStorage.runs.get(id);
  if (!existing) return null;
  const run = normalizeApprovalFields(existing);
  if (run.approvalStatus === 'rejected') {
    throw new Error('Rejected runs cannot be approved without creating a new run.');
  }
  const updated = updateRun(run, {
    approvalStatus: 'approved',
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy,
    handoffStatus: run.handoffStatus || 'not_started',
  });
  automationStorage.history.append(createHistoryEntry('run', updated.id, 'approved', { approvedBy }));
  audit('automation.approved', updated, 'success', { approvedBy });
  return updated;
}

export function rejectAutomationRun(id: string, rejectedBy = 'user', reason?: string): AutomationRunRecord | null {
  const existing = automationStorage.runs.get(id);
  if (!existing) return null;
  const run = normalizeApprovalFields(existing);
  const updated = updateRun(run, {
    approvalStatus: 'rejected',
    status: 'cancelled',
    rejectedAt: new Date().toISOString(),
    rejectedBy,
    rejectionReason: sanitizeReason(reason),
    handoffStatus: 'not_started',
  });
  automationStorage.history.append(createHistoryEntry('run', updated.id, 'rejected', { rejectedBy, reason: sanitizeReason(reason) }));
  audit('automation.rejected', updated, 'success', { rejectedBy });
  return updated;
}

export function handoffAutomationRun(id: string): { run?: AutomationRunRecord; message?: string; errors?: string[] } {
  const existing = automationStorage.runs.get(id);
  if (!existing) return { errors: ['Automation run not found.'] };
  const run = normalizeApprovalFields(existing);
  if (run.approvalStatus === 'rejected') return { errors: ['Rejected runs cannot be handed off.'] };
  if (run.approvalStatus !== 'approved') return { errors: ['Run must be approved before handoff.'] };

  automationStorage.history.append(createHistoryEntry('run', run.id, 'handoff_requested'));
  audit('automation.handoff.requested', run, 'pending');

  if (run.toolGatewayToolIds.length === 0) {
    const updated = updateRun(run, { handoffStatus: 'handed_off', handoffTarget: 'manual' });
    automationStorage.history.append(createHistoryEntry('run', updated.id, 'handoff_completed', { target: 'manual' }));
    audit('automation.handoff.completed', updated, 'success', { target: 'manual' });
    return { run: updated, message: 'Manual handoff required. No Tool Gateway tool was referenced.' };
  }

  const sources = listGatewaySources();
  const errors: string[] = [];
  const createdCallIds: string[] = [];

  for (const toolId of run.toolGatewayToolIds) {
    const tool = getGatewayTool(toolId);
    const source = tool ? sources.find((item) => item.id === tool.sourceId) : undefined;
    const permission = evaluateToolPermission(source, tool);
    if (!tool || !source || !permission.allowed) {
      errors.push(permission.reason || `Tool ${toolId} is unavailable.`);
      continue;
    }
    const gatewayCall = createGatewayCall(toolId, {
      automationRunId: run.id,
      task: run.task,
      sourceType: run.sourceType,
    });
    if (gatewayCall.error || !gatewayCall.call) {
      errors.push(gatewayCall.error || `Failed to create Tool Gateway call for ${toolId}.`);
      continue;
    }
    createdCallIds.push(gatewayCall.call.id);
    if (gatewayCall.audit) {
      storage.audit.create(gatewayCall.audit);
    }
  }

  if (errors.length > 0 && createdCallIds.length === 0) {
    const updated = updateRun(run, { handoffStatus: 'failed', handoffTarget: 'tool_gateway' });
    automationStorage.history.append(createHistoryEntry('run', updated.id, 'handoff_failed', { errors }));
    audit('automation.handoff.failed', updated, 'failure', { errors });
    return { run: updated, errors };
  }

  const updated = updateRun(run, {
    handoffStatus: createdCallIds.length > 0 ? 'queued' : 'failed',
    handoffTarget: 'tool_gateway',
    report: {
      ...(run.report || { summary: '', runId: run.id, createdAt: new Date().toISOString(), notes: [], toolCallIds: [] }),
      summary: `Automation run ${run.id} approved and handed off safely.`,
      toolCallIds: [...(run.report?.toolCallIds || []), ...createdCallIds],
      notes: [...(run.report?.notes || []), errors.length > 0 ? `Partial handoff issues: ${errors.join(' ')}` : 'Handoff created Tool Gateway call records.'],
    },
  });
  automationStorage.history.append(createHistoryEntry('run', updated.id, 'handoff_completed', { toolCallIds: createdCallIds }));
  audit('automation.handoff.completed', updated, 'success', { toolCallIds: createdCallIds });
  return { run: updated, errors: errors.length > 0 ? errors : undefined };
}
