import type { ExecutionHistoryEntry } from './types';

export function createExecutionHistoryEntry(queueItemId: string, action: string, metadata?: Record<string, unknown>): ExecutionHistoryEntry {
  return {
    id: `exec_hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    queueItemId,
    action,
    createdAt: new Date().toISOString(),
    metadata,
  };
}
