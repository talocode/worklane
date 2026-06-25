import type { AutomationReport, AutomationRunRecord } from './types';

export function createAutomationReport(run: AutomationRunRecord, notes: string[] = []): AutomationReport {
  return {
    summary: `Automation run ${run.id} prepared for ${run.sourceType} ${run.sourceName}.`,
    runId: run.id,
    createdAt: new Date().toISOString(),
    notes,
    toolCallIds: [],
  };
}
