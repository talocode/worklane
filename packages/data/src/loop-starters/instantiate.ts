import { permissionProfileRules } from '../automation/permissions';
import { getLoopStarter } from './starters';
import { validateInstantiateMode } from './validate';
import type {
  LoopStarterInstantiateInput,
  LoopStarterInstantiateResult,
  LoopStarterRoutineDraft,
  WorkLaneLoopStarterMode,
} from './types';

function createDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cadenceToSchedule(cadence: string): LoopStarterRoutineDraft['schedule'] | undefined {
  const normalized = cadence.trim().toLowerCase();
  if (!normalized || normalized === 'manual' || normalized.includes('on demand') || normalized.includes('after merge')) {
    return undefined;
  }

  if (normalized === 'daily') {
    return { intervalMinutes: 24 * 60 };
  }
  if (normalized === 'weekly') {
    return { intervalMinutes: 7 * 24 * 60 };
  }

  const hourMatch = normalized.match(/every\s+(\d+)\s+hour/);
  if (hourMatch) {
    return { intervalMinutes: Number(hourMatch[1]) * 60 };
  }

  return undefined;
}

function resolveTriggerType(
  cadence: string,
  templateTrigger: unknown,
): LoopStarterRoutineDraft['triggerType'] {
  const normalized = cadence.trim().toLowerCase();
  if (
    normalized === 'manual' ||
    normalized.includes('on release') ||
    normalized.includes('after merge') ||
    templateTrigger === 'manual'
  ) {
    return 'manual';
  }
  return 'schedule';
}

function buildWarnings(
  mode: WorkLaneLoopStarterMode,
  starterName: string,
  toolIds: string[],
  requiredTools: string[],
): string[] {
  const warnings = [
    'Instantiation returns a routine draft only. No scheduler run is created automatically.',
    'Save and run the routine only after reviewing the draft and required approvals.',
    `Starter "${starterName}" remains approval-first in every execution path.`,
  ];

  if (mode === 'report_only') {
    warnings.push('First run should stay in report_only mode to validate findings before enabling write steps.');
  }

  const missingTools = requiredTools.filter((toolId) => !toolIds.includes(toolId));
  if (missingTools.length > 0) {
    warnings.push(`Missing recommended tools: ${missingTools.join(', ')}. Register tools before scheduling runs.`);
  }

  return warnings;
}

export function instantiateLoopStarter(
  starterId: string,
  input: LoopStarterInstantiateInput,
): LoopStarterInstantiateResult {
  const starter = getLoopStarter(starterId);
  if (!starter) {
    throw new Error(`Loop starter not found: ${starterId}`);
  }

  if (!input.title?.trim()) {
    throw new Error('title is required');
  }
  if (!input.repo?.trim()) {
    throw new Error('repo is required');
  }
  if (!input.cadence?.trim()) {
    throw new Error('cadence is required');
  }
  if (!Array.isArray(input.toolIds)) {
    throw new Error('toolIds must be an array');
  }

  const mode = input.mode || starter.defaultMode;
  const modeValidation = validateInstantiateMode(starter, mode);
  if (!modeValidation.valid) {
    throw new Error(modeValidation.reason || 'Invalid mode for starter');
  }

  const createdAt = new Date().toISOString();
  const toolIds = input.toolIds.filter((toolId) => typeof toolId === 'string' && toolId.trim().length > 0);
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  const triggerType = resolveTriggerType(input.cadence, starter.routineTemplate.triggerType);
  const schedule = triggerType === 'schedule' ? cadenceToSchedule(input.cadence) : undefined;

  const state: Record<string, unknown> = {
    ...starter.stateSchema,
    repo: input.repo.trim(),
    notes,
    mode,
    starterId: starter.id,
    lastInstantiatedAt: createdAt,
  };

  const routineDraft: LoopStarterRoutineDraft = {
    id: createDraftId(),
    name: input.title.trim(),
    description:
      typeof starter.routineTemplate.description === 'string'
        ? starter.routineTemplate.description
        : starter.description,
    task:
      typeof starter.routineTemplate.task === 'string'
        ? `${starter.routineTemplate.task} Target repo: ${input.repo.trim()}.`
        : `Run ${starter.name} for ${input.repo.trim()} in ${mode} mode.`,
    triggerType,
    toolGatewayToolIds: toolIds.length > 0 ? toolIds : [...starter.requiredTools],
    status: 'draft',
    approvalRequired: true,
    permissionProfile: starter.permissionProfile,
    mode,
    starterId: starter.id,
    repo: input.repo.trim(),
    cadence: input.cadence.trim(),
    notes,
    state,
    schedule,
    createdAt,
  };

  const verificationChecklist = [
    ...starter.verificationChecks,
    ...permissionProfileRules(starter.permissionProfile),
    'Review the routine draft before saving it to automation storage.',
    'Confirm cadence and trigger type match your operational expectations.',
  ];

  return {
    routineDraft,
    permissionProfile: starter.permissionProfile,
    approvalRequired: true,
    requiredTools: [...starter.requiredTools],
    verificationChecklist,
    warnings: buildWarnings(mode, starter.name, routineDraft.toolGatewayToolIds, starter.requiredTools),
  };
}