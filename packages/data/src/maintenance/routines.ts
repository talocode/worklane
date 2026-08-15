import type { MaintenanceRoutineDefinition, MaintenanceRoutineId } from './types';

const sharedConstraints = [
  'Start in report-only mode and propose the smallest relevant patch.',
  'Never push, merge, publish, deploy, or delete without explicit human approval.',
  'Do not use production credentials or user data.',
  'Stop when repository context, required tools, or verification signals are missing.',
  'Never approve or merge work produced by the same run.',
];

const sharedVerification = [
  'Include deterministic reproduction steps or state why reproduction was not possible.',
  'Attach the exact verification commands and outcomes.',
  'Record files changed, risk notes, unresolved items, and a rollback path.',
  'Require independent automated checks and human review before merge.',
];

const sharedReportFields = [
  'summary',
  'reproduction',
  'rootCause',
  'proposedChange',
  'filesChanged',
  'verification',
  'risks',
  'confidence',
  'rollback',
  'unresolved',
];

export const MAINTENANCE_ROUTINES: MaintenanceRoutineDefinition[] = [
  {
    id: 'flaky-test-diagnosis',
    name: 'Flaky Test Diagnosis',
    description: 'Identify a reproducible flaky-test signal and propose a root-cause fix with repeat-run evidence.',
    risk: 'medium',
    defaultCadence: 'daily',
    permissionProfile: 'draft_only',
    steps: ['collect_failure_history', 'reproduce_in_isolation', 'identify_root_cause', 'draft_minimal_patch', 'repeat_verification'],
    constraints: [...sharedConstraints, 'Do not delete or weaken a test to make the suite pass.'],
    verificationChecks: [...sharedVerification, 'Repeat the affected test enough times to expose intermittent behavior.'],
    reportFields: sharedReportFields,
  },
  {
    id: 'dead-code-candidates',
    name: 'Dead Code Candidates',
    description: 'Find code that may be unreachable and produce evidence-backed removal candidates without deleting code automatically.',
    risk: 'medium',
    defaultCadence: 'weekly',
    permissionProfile: 'draft_only',
    steps: ['scan_static_references', 'inspect_dynamic_entry_points', 'collect_runtime_evidence', 'rank_candidates', 'draft_removal_plan'],
    constraints: [...sharedConstraints, 'Treat static reachability as a candidate signal, not proof of dead code.'],
    verificationChecks: [...sharedVerification, 'Check dynamic loading, configuration, reflection, generated code, and public API usage.'],
    reportFields: sharedReportFields,
  },
  {
    id: 'duplicate-implementation-detection',
    name: 'Duplicate Implementation Detection',
    description: 'Locate diverging implementations of the same behavior and propose a bounded unification plan.',
    risk: 'medium',
    defaultCadence: 'weekly',
    permissionProfile: 'draft_only',
    steps: ['identify_similar_behavior', 'compare_contracts', 'map_callers', 'select_canonical_boundary', 'draft_unification_patch'],
    constraints: [...sharedConstraints, 'Do not unify code based on text similarity alone.'],
    verificationChecks: [...sharedVerification, 'Prove behavioral equivalence or preserve documented differences with explicit tests.'],
    reportFields: sharedReportFields,
  },
];

export function listMaintenanceRoutines(): MaintenanceRoutineDefinition[] {
  return MAINTENANCE_ROUTINES.map((routine) => ({
    ...routine,
    steps: [...routine.steps],
    constraints: [...routine.constraints],
    verificationChecks: [...routine.verificationChecks],
    reportFields: [...routine.reportFields],
  }));
}

export function getMaintenanceRoutine(id: string): MaintenanceRoutineDefinition | undefined {
  const routine = MAINTENANCE_ROUTINES.find((item) => item.id === id);
  return routine ? listMaintenanceRoutines().find((item) => item.id === routine.id) : undefined;
}

export function isMaintenanceRoutineId(value: string): value is MaintenanceRoutineId {
  return MAINTENANCE_ROUTINES.some((routine) => routine.id === value);
}
