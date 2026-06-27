# Loop Starter Kits

WorkLane Loop Starter Kits v0.1 ships reusable loop engineering patterns for builders who want safe, repeatable agent workflows without writing every routine from scratch.

## What Are Loop Starter Kits?

A loop starter kit is a curated template that combines:

- a routine shape
- a state schema
- required tools
- verification checks
- failure policy guidance
- final report fields

Instantiation creates a **routine draft only**. It does not schedule runs, execute tools, or mutate remote systems.

## Available Starters

| ID | Name | Category | Risk | Default mode |
| --- | --- | --- | --- | --- |
| `daily-triage` | Daily Triage | operations | low | `report_only` |
| `ci-sweeper` | CI Sweeper | operations | medium | `report_only` |
| `pr-babysitter` | PR Babysitter | coding | medium | `approval_required` |
| `dependency-sweeper` | Dependency Sweeper | maintenance | medium | `report_only` |
| `issue-triage` | Issue Triage | support | low | `report_only` |
| `changelog-drafter` | Changelog Drafter | release | low | `report_only` |
| `post-merge-cleanup` | Post-Merge Cleanup | maintenance | medium | `approval_required` |

## Risk Levels

- `low`: read-oriented reporting with minimal follow-up risk
- `medium`: broader inspection or draft steps that may lead to write actions after approval
- `high`: reserved for future starters that coordinate multiple approval-gated actions

v0.1 starters default to `low` or `medium` and always keep execution approval-first.

## Approval-First Behavior

Every instantiated routine draft sets:

- `approvalRequired: true`
- a permission profile (`read_only`, `draft_only`, `approval_required`, or `manual_only`)
- verification checks that block autonomous push, merge, publish, deploy, or delete behavior

Write and destructive actions remain behind human approval even after a routine is saved.

## Report-Only First-Run Recommendation

Start with `report_only` mode when adopting a new starter. This lets a team validate findings, tool coverage, and cadence before enabling approval-gated follow-up work.

## State Schema

Each starter defines a `stateSchema` object describing the local state fields the loop expects, such as:

- target repository
- collected findings
- timestamps for the last sweep or triage
- draft-only output buckets

Instantiation merges user input (`repo`, `notes`, `mode`) into that schema inside the returned draft.

## Verification Checks

Verification checks are copied into the instantiate response as a checklist. They confirm:

- approval remains required
- required tools are registered
- no autonomous destructive action is present in the starter definition

Use the checklist during review before saving the routine.

## Failure Policy

Failure policy guidance explains how a loop should behave when data is incomplete or tools are unavailable:

- stop before remote writes
- return partial reports instead of guessing
- escalate write steps to explicit approval
- never auto-push, auto-merge, auto-publish, auto-deploy, or auto-delete

## API Endpoints

- `GET /api/loop-starters`
- `GET /api/loop-starters/:id`
- `POST /api/loop-starters/:id/instantiate`

Instantiate request body:

```json
{
  "title": "Daily Triage — my-repo",
  "repo": "owner/repo",
  "cadence": "daily",
  "toolIds": ["tool_worklane_run_create"],
  "mode": "report_only",
  "notes": "First dry run"
}
```

Instantiate response includes:

- `routineDraft`
- `permissionProfile`
- `approvalRequired`
- `requiredTools`
- `verificationChecklist`
- `warnings`

## Dashboard

Open `/dashboard/loop-starters` to browse starter cards, review risk and cadence metadata, instantiate a draft, and inspect the generated preview.

## Limitations

- Instantiation does not create live scheduled runs
- Starters do not bypass Tool Gateway permission checks
- No arbitrary shell execution is included
- Saving a draft to automation storage is a separate explicit step
- v0.1 uses local JSON storage and placeholder tool responses
- External provider integrations remain manual or approval-gated

## Examples

See `examples/loop-starters/` for starter-specific JSON examples with safe default modes, suggested cadence, required approvals, and final report templates.