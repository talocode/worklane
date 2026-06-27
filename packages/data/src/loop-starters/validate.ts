import type { WorkLaneLoopStarter, WorkLaneLoopStarterMode } from './types';

const REQUIRED_STARTER_FIELDS: (keyof WorkLaneLoopStarter)[] = [
  'id',
  'name',
  'description',
  'category',
  'risk',
  'suggestedCadence',
  'defaultMode',
  'requiredTools',
  'permissionProfile',
  'stateSchema',
  'routineTemplate',
  'verificationChecks',
  'failurePolicy',
  'finalReportFields',
];

const DISALLOWED_AUTONOMOUS_PATTERNS = [
  /\bauto[-_]?push\b(?!\s+without)/i,
  /\bauto[-_]?merge\b(?!\s+without)/i,
  /\bauto[-_]?publish\b(?!\s+without)/i,
  /\bauto[-_]?deploy\b(?!\s+without)/i,
  /\bauto[-_]?delete\b(?!\s+without)/i,
];

const NEGATION_PREFIX = /(?:no[-_]|never[-_]|block[-_]|without[-_]|requires[-_]approval|approval[-_]before|approval[-_]required|approval[-_]gated)/i;

const ALLOWED_MODES: WorkLaneLoopStarterMode[] = ['report_only', 'approval_required'];

function collectStarterText(starter: WorkLaneLoopStarter): string {
  return JSON.stringify({
    routineTemplate: starter.routineTemplate,
    failurePolicy: starter.failurePolicy,
    verificationChecks: starter.verificationChecks,
    stateSchema: starter.stateSchema,
  }).toLowerCase();
}

export function validateStarterShape(starter: WorkLaneLoopStarter): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  for (const field of REQUIRED_STARTER_FIELDS) {
    const value = starter[field];
    if (value === undefined || value === null) {
      reasons.push(`Missing required field: ${field}`);
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      reasons.push(`Field ${field} must not be empty`);
    }
    if (field === 'stateSchema' || field === 'routineTemplate') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        reasons.push(`Field ${field} must be an object`);
      }
    }
  }

  if (!['low', 'medium', 'high'].includes(starter.risk)) {
    reasons.push(`Invalid risk level: ${starter.risk}`);
  }

  if (!ALLOWED_MODES.includes(starter.defaultMode)) {
    reasons.push(`Invalid defaultMode: ${starter.defaultMode}`);
  }

  const safety = validateStarterSafety(starter);
  if (!safety.safe) {
    reasons.push(...safety.violations);
  }

  return { valid: reasons.length === 0, reasons };
}

function isNegatedMatch(text: string, matchIndex: number): boolean {
  const windowStart = Math.max(0, matchIndex - 24);
  const prefix = text.slice(windowStart, matchIndex);
  return NEGATION_PREFIX.test(prefix);
}

export function validateStarterSafety(starter: WorkLaneLoopStarter): { safe: boolean; violations: string[] } {
  const text = collectStarterText(starter);
  const violations: string[] = [];

  for (const pattern of DISALLOWED_AUTONOMOUS_PATTERNS) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const globalPattern = new RegExp(pattern.source, flags);
    for (const match of text.matchAll(globalPattern)) {
      if (match.index !== undefined && !isNegatedMatch(text, match.index)) {
        violations.push(`Disallowed autonomous action pattern detected in starter ${starter.id}`);
        break;
      }
    }
  }

  const constraints = starter.routineTemplate.constraints;
  if (Array.isArray(constraints)) {
    for (const constraint of constraints) {
      const value = String(constraint).toLowerCase();
      if (/^auto[-_]?(push|merge|publish|deploy)$/.test(value)) {
        violations.push(`Starter ${starter.id} allows ${value} in constraints`);
      }
    }
  }

  return { safe: violations.length === 0, violations };
}

export function validateInstantiateMode(
  starter: WorkLaneLoopStarter,
  mode: WorkLaneLoopStarterMode,
): { valid: boolean; reason?: string } {
  if (!ALLOWED_MODES.includes(mode)) {
    return { valid: false, reason: `Unsupported mode: ${mode}` };
  }

  if (starter.permissionProfile === 'read_only' && mode === 'approval_required') {
    return {
      valid: false,
      reason: 'Read-only starters should stay in report_only mode unless tools are upgraded first.',
    };
  }

  return { valid: true };
}

export function validateAllStarters(starters: WorkLaneLoopStarter[]): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const starter of starters) {
    const result = validateStarterShape(starter);
    if (!result.valid) {
      reasons.push(...result.reasons.map((reason) => `${starter.id}: ${reason}`));
    }
  }
  return { valid: reasons.length === 0, reasons };
}