import type { AutomationHistoryEntry } from './types';

export function createHistoryEntry(
  automationType: AutomationHistoryEntry['automationType'],
  automationId: string,
  action: string,
  metadata?: Record<string, unknown>
): AutomationHistoryEntry {
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    automationType,
    automationId,
    action,
    createdAt: new Date().toISOString(),
    metadata,
  };
}
