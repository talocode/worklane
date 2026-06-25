import type { AutomationTriggerType } from './types';

export function normalizeTriggerType(triggerType?: AutomationTriggerType): AutomationTriggerType {
  return triggerType || 'manual';
}

export function isSchedulerTrigger(triggerType: AutomationTriggerType): boolean {
  return triggerType === 'schedule';
}
