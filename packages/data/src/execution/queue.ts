import { storage } from '../storage';
import { getGatewayTool, listGatewaySources } from '../tool-gateway/registry';
import { sourceConfigSignal } from '../tool-gateway/sources';
import { toolGatewayStorage } from '../tool-gateway/storage';
import { runGatewayCall } from '../tool-gateway/executor';
import { executionStorage } from './storage';
import { createExecutionHistoryEntry } from './history';
import type { ExecutionQueueItem, ExecutionQueueStatus, ExecutionSummary } from './types';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function audit(action: string, item: ExecutionQueueItem, result: 'success' | 'failure' | 'pending', metadata?: Record<string, unknown>) {
  const event = storage.audit.create({
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action,
    target: item.id,
    targetType: 'execution_queue_item',
    result,
    metadata,
  });
  item.auditIds = [...item.auditIds, event.id];
  executionStorage.queue.save(item);
  return event;
}

function deriveQueueState(callId: string): { item?: ExecutionQueueItem; error?: string } {
  const call = toolGatewayStorage.getCall(callId);
  if (!call) return { error: 'Tool call not found.' };
  const tool = getGatewayTool(call.toolId);
  if (!tool) return { error: 'Tool not found.' };
  const source = listGatewaySources().find((entry) => entry.id === tool.sourceId);
  if (!source) return { error: 'Source not found.' };

  let status: ExecutionQueueStatus = 'blocked';
  let manualReason: string | undefined;

  if (call.status !== 'approved') {
    status = 'blocked';
    manualReason = call.status === 'pending_approval' ? 'Tool call still requires Tool Gateway approval.' : 'Tool call is not approved for execution.';
  } else if (tool.riskLevel === 'destructive' || tool.riskLevel === 'external') {
    status = 'manual_required';
    manualReason = 'This tool risk level must not auto-run in v0.1.';
  } else if (source.enabled === false || tool.enabled === false) {
    status = 'blocked';
    manualReason = 'Source or tool is disabled.';
  } else if (sourceConfigSignal(source) === 'missing_env' && source.type !== 'talocode' && source.type !== 'local') {
    status = 'blocked';
    manualReason = 'Required auth configuration is missing.';
  } else if (source.type === 'talocode' && tool.riskLevel === 'read') {
    status = 'ready';
  } else {
    status = 'manual_required';
    manualReason = 'This tool is not supported for safe automatic execution in v0.1.';
  }

  const input = call.input || {};
  const item: ExecutionQueueItem = {
    id: createId('queue'),
    toolCallId: call.id,
    sourceId: source.id,
    toolId: tool.id,
    toolName: tool.displayName,
    sourceName: source.name,
    status,
    riskLevel: tool.riskLevel,
    approvalRequired: call.approvalRequired,
    approvedAt: call.approvedAt,
    queuedAt: new Date().toISOString(),
    manualReason,
    auditIds: [],
    automationRunId: typeof input.automationRunId === 'string' ? input.automationRunId : undefined,
    loopId: typeof input.loopId === 'string' ? input.loopId : undefined,
    routineId: typeof input.routineId === 'string' ? input.routineId : undefined,
  };
  return { item };
}

function refreshQueueItem(item: ExecutionQueueItem): { item?: ExecutionQueueItem; error?: string } {
  if (['running', 'succeeded', 'failed', 'cancelled'].includes(item.status)) {
    return { item };
  }

  const derived = deriveQueueState(item.toolCallId);
  if (derived.error || !derived.item) {
    const blocked = executionStorage.queue.save({
      ...item,
      status: 'blocked',
      manualReason: derived.error || 'Failed to refresh execution queue item.',
      error: undefined,
    });
    return { item: blocked };
  }
  const refreshed = executionStorage.queue.save({
    ...item,
    sourceId: derived.item.sourceId,
    toolId: derived.item.toolId,
    toolName: derived.item.toolName,
    sourceName: derived.item.sourceName,
    status: derived.item.status,
    riskLevel: derived.item.riskLevel,
    approvalRequired: derived.item.approvalRequired,
    approvedAt: derived.item.approvedAt,
    manualReason: derived.item.manualReason,
    automationRunId: derived.item.automationRunId,
    loopId: derived.item.loopId,
    routineId: derived.item.routineId,
  });
  return { item: refreshed };
}

export function listExecutionQueue(): ExecutionQueueItem[] {
  return executionStorage.queue.list();
}

export function getExecutionQueueItem(id: string): ExecutionQueueItem | undefined {
  return executionStorage.queue.get(id);
}

export function ensureQueueItemForToolCall(callId: string): { item?: ExecutionQueueItem; error?: string } {
  const existing = executionStorage.queue.findByToolCallId(callId);
  if (existing) return refreshQueueItem(existing);
  const created = deriveQueueState(callId);
  if (created.error || !created.item) return { error: created.error || 'Failed to create execution queue item.' };
  executionStorage.queue.save(created.item);
  executionStorage.history.append(createExecutionHistoryEntry(created.item.id, 'queued', { toolCallId: callId, status: created.item.status }));
  audit('execution.queue.created', created.item, created.item.status === 'blocked' ? 'pending' : 'success', { toolCallId: callId });
  return { item: created.item };
}

export function queueApprovedToolCall(callId: string): { item?: ExecutionQueueItem; error?: string } {
  const call = toolGatewayStorage.getCall(callId);
  if (!call) return { error: 'Tool call not found.' };
  if (call.status !== 'approved') return { error: 'Only approved tool calls can be queued for execution.' };
  return ensureQueueItemForToolCall(callId);
}

export function runExecutionQueueItem(id: string): { item?: ExecutionQueueItem; error?: string } {
  const existing = getExecutionQueueItem(id);
  if (!existing) return { error: 'Execution queue item not found.' };
  const refreshedResult = refreshQueueItem(existing);
  if (refreshedResult.error || !refreshedResult.item) return { error: refreshedResult.error || 'Execution queue item could not be refreshed.' };
  const item = refreshedResult.item;
  if (item.status !== 'ready') return { item, error: 'Execution queue item is not ready to run.' };
  const started = executionStorage.queue.save({ ...item, status: 'running', startedAt: new Date().toISOString(), error: undefined, manualReason: undefined });
  executionStorage.history.append(createExecutionHistoryEntry(started.id, 'run.started'));
  audit('execution.run.started', started, 'pending');

  const result = runGatewayCall(started.toolCallId);
  if (result.error || !result.call) {
    const failed = executionStorage.queue.save({ ...started, status: 'failed', completedAt: new Date().toISOString(), error: result.error || 'Execution failed.' });
    executionStorage.history.append(createExecutionHistoryEntry(failed.id, 'run.failed', { error: failed.error }));
    audit('execution.run.failed', failed, 'failure', { error: failed.error });
    return { item: failed, error: failed.error };
  }

  const finished = executionStorage.queue.save({ ...started, status: 'succeeded', completedAt: new Date().toISOString(), result: result.call.result });
  executionStorage.history.append(createExecutionHistoryEntry(finished.id, 'run.succeeded'));
  audit('execution.run.succeeded', finished, 'success');
  if (result.audit) storage.audit.create(result.audit);
  return { item: finished };
}

export function markExecutionQueueItemManual(id: string, reason?: string): ExecutionQueueItem | null {
  const item = getExecutionQueueItem(id);
  if (!item) return null;
  const updated = executionStorage.queue.save({ ...item, status: 'manual_required', manualReason: (reason || 'Manual execution required.').slice(0, 300), completedAt: new Date().toISOString() });
  executionStorage.history.append(createExecutionHistoryEntry(updated.id, 'manual_required', { reason: updated.manualReason }));
  audit('execution.manual_required', updated, 'success', { reason: updated.manualReason });
  return updated;
}

export function cancelExecutionQueueItem(id: string): ExecutionQueueItem | null {
  const item = getExecutionQueueItem(id);
  if (!item) return null;
  if (!['queued', 'ready', 'blocked', 'manual_required'].includes(item.status)) return null;
  const updated = executionStorage.queue.save({ ...item, status: 'cancelled', completedAt: new Date().toISOString() });
  executionStorage.history.append(createExecutionHistoryEntry(updated.id, 'cancelled'));
  audit('execution.cancelled', updated, 'success');
  return updated;
}

export function recordExecutionResult(id: string, patch: { status: ExecutionQueueStatus; result?: unknown; error?: string }): ExecutionQueueItem | null {
  const item = getExecutionQueueItem(id);
  if (!item) return null;
  const updated = executionStorage.queue.save({ ...item, status: patch.status, result: patch.result, error: patch.error, completedAt: new Date().toISOString() });
  executionStorage.history.append(createExecutionHistoryEntry(updated.id, 'result.recorded', { status: patch.status }));
  audit('execution.result.recorded', updated, patch.status === 'failed' ? 'failure' : 'success', { status: patch.status });
  return updated;
}

export function getExecutionSummary(item: ExecutionQueueItem): ExecutionSummary {
  const warnings: string[] = [];
  if (item.status === 'manual_required' && item.manualReason) warnings.push(item.manualReason);
  if (item.status === 'blocked' && item.manualReason) warnings.push(item.manualReason);
  if (item.error) warnings.push(item.error);
  return {
    id: item.id,
    toolCallId: item.toolCallId,
    toolName: item.toolName,
    sourceName: item.sourceName,
    status: item.status,
    riskLevel: item.riskLevel,
    approvalRequired: item.approvalRequired,
    approvedAt: item.approvedAt,
    queuedAt: item.queuedAt,
    completedAt: item.completedAt,
    result: item.result,
    error: item.error,
    manualReason: item.manualReason,
    warnings,
    automationRunId: item.automationRunId,
    loopId: item.loopId,
    routineId: item.routineId,
  };
}
