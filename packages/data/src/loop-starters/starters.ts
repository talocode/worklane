import type { WorkLaneLoopStarter } from './types';

const baseFailurePolicy = [
  'Stop on missing repo context and surface a clear report-only summary.',
  'Never push, merge, publish, deploy, or delete without explicit human approval.',
  'Escalate write or destructive steps to explicit human approval.',
  'Record partial progress in the final report without mutating remote state.',
];

const baseVerificationChecks = [
  'Confirm approvalRequired remains true on the routine draft.',
  'Confirm push, merge, publish, deploy, and delete steps remain approval-gated.',
  'Confirm required tools are registered and permission-checked before any run.',
];

const baseReportFields = [
  'summary',
  'repo',
  'starterId',
  'mode',
  'findings',
  'recommendedNextSteps',
  'approvalStatus',
];

export const LOOP_STARTERS: WorkLaneLoopStarter[] = [
  {
    id: 'daily-triage',
    name: 'Daily Triage',
    description:
      'Collect open work signals across a repository and produce a morning triage report without changing remote state.',
    category: 'operations',
    risk: 'low',
    suggestedCadence: 'daily',
    defaultMode: 'report_only',
    requiredTools: ['tool_worklane_run_create', 'tool_stacklane_project_inspect'],
    permissionProfile: 'read_only',
    stateSchema: {
      repo: { type: 'string', required: true },
      openItems: { type: 'array', items: { type: 'object' } },
      priorityBuckets: { type: 'object' },
      lastTriageAt: { type: 'string', format: 'date-time' },
    },
    routineTemplate: {
      triggerType: 'schedule',
      task: 'Review open work for the target repository and draft a daily triage summary in report-only mode.',
      description: 'Morning triage loop that stays read-only until a human approves any follow-up action.',
      steps: ['inspect_repo_signals', 'bucket_by_priority', 'draft_triage_report'],
      constraints: ['read_only', 'no_remote_writes', 'approval_before_follow_up'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify triage output is a draft report with no repository mutations.',
      'Verify priority buckets reference only read-oriented inspection results.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If inspection tools are unavailable, return a partial triage report with manual follow-up notes.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'openItemCount',
      'prioritySummary',
      'blockers',
    ],
  },
  {
    id: 'ci-sweeper',
    name: 'CI Sweeper',
    description:
      'Scan recent continuous integration outcomes and surface failing checks that need human review.',
    category: 'operations',
    risk: 'medium',
    suggestedCadence: 'every 4 hours',
    defaultMode: 'report_only',
    requiredTools: ['tool_stacklane_project_inspect', 'tool_worklane_run_create'],
    permissionProfile: 'read_only',
    stateSchema: {
      repo: { type: 'string', required: true },
      failingChecks: { type: 'array', items: { type: 'object' } },
      lastSweepAt: { type: 'string', format: 'date-time' },
      flakySignals: { type: 'array', items: { type: 'string' } },
    },
    routineTemplate: {
      triggerType: 'schedule',
      task: 'Sweep recent CI results and produce a failing-check summary without triggering reruns automatically.',
      description: 'CI health sweep that reports failures and recommends manual remediation.',
      steps: ['collect_ci_signals', 'classify_failures', 'draft_ci_report'],
      constraints: ['read_only', 'no_ci_rerun', 'no_deploy', 'approval_before_fix'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify no CI rerun or deploy command is scheduled automatically.',
      'Verify failing checks are listed with timestamps and suggested owners.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If CI signal collection is incomplete, mark affected checks as needs_manual_review.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'failingCheckCount',
      'flakyCheckCount',
      'suggestedOwners',
    ],
  },
  {
    id: 'pr-babysitter',
    name: 'PR Babysitter',
    description:
      'Monitor open pull requests for review gaps, stale threads, and CI blockers while keeping all fixes approval-gated.',
    category: 'coding',
    risk: 'medium',
    suggestedCadence: 'every 2 hours',
    defaultMode: 'approval_required',
    requiredTools: ['tool_worklane_run_create', 'tool_stacklane_project_inspect'],
    permissionProfile: 'draft_only',
    stateSchema: {
      repo: { type: 'string', required: true },
      openPullRequests: { type: 'array', items: { type: 'object' } },
      reviewGaps: { type: 'array', items: { type: 'object' } },
      lastReviewSweepAt: { type: 'string', format: 'date-time' },
    },
    routineTemplate: {
      triggerType: 'schedule',
      task: 'Review open pull requests and draft babysitting notes without merging or pushing changes.',
      description: 'Pull request babysitting loop that drafts follow-up items and waits for approval.',
      steps: ['list_open_prs', 'detect_review_gaps', 'draft_babysitting_notes'],
      constraints: ['draft_only', 'merge_requires_approval', 'push_requires_approval', 'approval_before_comment'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify no merge or push action is included in the routine draft.',
      'Verify suggested comments remain drafts until explicitly approved.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If pull request metadata is unavailable, report the gap and request manual review.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'openPrCount',
      'stalePrCount',
      'reviewGapSummary',
    ],
  },
  {
    id: 'dependency-sweeper',
    name: 'Dependency Sweeper',
    description:
      'Identify outdated or vulnerable dependencies and produce an upgrade plan without applying changes automatically.',
    category: 'maintenance',
    risk: 'medium',
    suggestedCadence: 'weekly',
    defaultMode: 'report_only',
    requiredTools: ['tool_stacklane_project_inspect', 'tool_worklane_run_create'],
    permissionProfile: 'read_only',
    stateSchema: {
      repo: { type: 'string', required: true },
      outdatedPackages: { type: 'array', items: { type: 'object' } },
      riskFindings: { type: 'array', items: { type: 'object' } },
      lastSweepAt: { type: 'string', format: 'date-time' },
    },
    routineTemplate: {
      triggerType: 'schedule',
      task: 'Sweep dependency manifests and draft an upgrade report without modifying lockfiles automatically.',
      description: 'Dependency maintenance loop that stays read-only until a human approves upgrade work.',
      steps: ['scan_dependency_manifests', 'rank_upgrade_candidates', 'draft_upgrade_report'],
      constraints: ['read_only', 'no_lockfile_write', 'no_publish', 'approval_before_upgrade'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify no lockfile or manifest write is attempted automatically.',
      'Verify upgrade recommendations include risk notes and test expectations.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If dependency metadata cannot be read, list missing files and stop before any write step.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'outdatedPackageCount',
      'highRiskFindings',
      'recommendedUpgradeOrder',
    ],
  },
  {
    id: 'issue-triage',
    name: 'Issue Triage',
    description:
      'Group incoming issues by severity and ownership, producing a triage draft for team review.',
    category: 'support',
    risk: 'low',
    suggestedCadence: 'daily',
    defaultMode: 'report_only',
    requiredTools: ['tool_worklane_run_create'],
    permissionProfile: 'read_only',
    stateSchema: {
      repo: { type: 'string', required: true },
      untriagedIssues: { type: 'array', items: { type: 'object' } },
      severityBuckets: { type: 'object' },
      lastTriageAt: { type: 'string', format: 'date-time' },
    },
    routineTemplate: {
      triggerType: 'schedule',
      task: 'Draft an issue triage summary and keep all label or assignment changes approval-gated.',
      description: 'Issue triage loop that reports priorities without mutating issue state automatically.',
      steps: ['collect_open_issues', 'bucket_by_severity', 'draft_triage_summary'],
      constraints: ['read_only', 'no_issue_close', 'no_label_write', 'approval_before_update'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify issue labels and assignments remain unchanged in report-only mode.',
      'Verify severity buckets map to explicit human review steps.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If issue listing fails, return a partial triage draft with manual collection instructions.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'untriagedIssueCount',
      'severitySummary',
      'suggestedOwners',
    ],
  },
  {
    id: 'changelog-drafter',
    name: 'Changelog Drafter',
    description:
      'Assemble release notes from recent merged work and produce a changelog draft for editorial review.',
    category: 'release',
    risk: 'low',
    suggestedCadence: 'on release branch cut',
    defaultMode: 'report_only',
    requiredTools: ['tool_worklane_run_create', 'tool_postlane_email_draft'],
    permissionProfile: 'draft_only',
    stateSchema: {
      repo: { type: 'string', required: true },
      releaseVersion: { type: 'string' },
      mergedChanges: { type: 'array', items: { type: 'object' } },
      changelogSections: { type: 'object' },
      lastDraftAt: { type: 'string', format: 'date-time' },
    },
    routineTemplate: {
      triggerType: 'manual',
      task: 'Draft changelog sections from recent changes without publishing or tagging a release automatically.',
      description: 'Release notes loop that produces editable drafts only.',
      steps: ['collect_recent_changes', 'group_changelog_sections', 'draft_release_notes'],
      constraints: ['draft_only', 'publish_requires_approval', 'tag_requires_approval', 'approval_before_release'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify changelog output is a local draft with no publish or tag action.',
      'Verify release version fields are optional until a human confirms them.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If change history is incomplete, mark missing sections and keep the draft unpublished.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'releaseVersion',
      'sectionSummary',
      'unresolvedChanges',
    ],
  },
  {
    id: 'post-merge-cleanup',
    name: 'Post-Merge Cleanup',
    description:
      'After merges land, identify follow-up cleanup tasks such as branch hygiene and doc updates while keeping writes approval-gated.',
    category: 'maintenance',
    risk: 'medium',
    suggestedCadence: 'after merge events',
    defaultMode: 'approval_required',
    requiredTools: ['tool_worklane_run_create', 'tool_stacklane_project_inspect'],
    permissionProfile: 'approval_required',
    stateSchema: {
      repo: { type: 'string', required: true },
      recentMerges: { type: 'array', items: { type: 'object' } },
      cleanupTasks: { type: 'array', items: { type: 'object' } },
      lastCleanupReviewAt: { type: 'string', format: 'date-time' },
    },
    routineTemplate: {
      triggerType: 'manual',
      task: 'Review recent merges and draft post-merge cleanup tasks without deleting branches or deploying automatically.',
      description: 'Post-merge hygiene loop that lists cleanup work and waits for explicit approval.',
      steps: ['collect_recent_merges', 'identify_cleanup_tasks', 'draft_cleanup_plan'],
      constraints: ['approval_required', 'delete_requires_approval', 'deploy_requires_approval', 'branch_delete_requires_approval'],
    },
    verificationChecks: [
      ...baseVerificationChecks,
      'Verify branch deletion and deploy steps remain manual or approval-gated.',
      'Verify cleanup tasks are listed with explicit risk labels.',
    ],
    failurePolicy: [
      ...baseFailurePolicy,
      'If merge metadata is stale, request manual confirmation before proposing cleanup actions.',
    ],
    finalReportFields: [
      ...baseReportFields,
      'recentMergeCount',
      'cleanupTaskCount',
      'blockedCleanupItems',
    ],
  },
];

export function listLoopStarters(): WorkLaneLoopStarter[] {
  return LOOP_STARTERS.map((starter) => ({ ...starter }));
}

export function getLoopStarter(id: string): WorkLaneLoopStarter | undefined {
  const starter = LOOP_STARTERS.find((item) => item.id === id);
  return starter ? { ...starter } : undefined;
}