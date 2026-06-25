# Loops & Routines

WorkLane Loops & Routines adds the local-first automation layer on top of Tool Gateway.

## Loops vs Routines

- Loops: short-term recurring tasks with local scheduler timing
- Routines: saved repeatable workflows that can be run manually in v0.1

## Local-First Scheduling

- no cloud dependency
- no external scheduler dependency
- no system cron dependency
- scheduler only works while the WorkLane process or dashboard server is running
- if a scheduled run was missed, v0.1 creates at most one catch-up run

## Approval-First Execution

- every loop and routine is `approvalRequired: true`
- every automation run is created in `pending_approval`
- destructive work is never auto-executed
- write, destructive, and external tool usage stays behind Tool Gateway permission checks

## Approval Workflow

Automation Approval UI adds a review layer for pending runs:

- list pending approval runs
- approve a run
- reject a run with optional reason
- hand off an approved run safely

Approved runs do not skip Tool Gateway safety checks. Rejected runs do not execute anything.

## Permission Profiles

- `read_only`
- `draft_only`
- `approval_required`
- `manual_only`

Default: `approval_required`

## Storage

Automation data is stored locally in:

```text
.worklane/automation/loops.json
.worklane/automation/routines.json
.worklane/automation/runs.json
.worklane/automation/history.json
```

No secrets, tokens, or raw env values are stored.

## Trigger Types

- `manual`
- `schedule`
- `api`
- `chat`
- `github_placeholder`

In v0.1, schedule and manual are the primary working paths. API, chat, and GitHub placeholder triggers are shape-only foundations.

## API Endpoints

- `GET /api/automation/health`
- `POST /api/automation/loops`
- `GET /api/automation/loops`
- `GET /api/automation/loops/:id`
- `POST /api/automation/loops/:id/pause`
- `POST /api/automation/loops/:id/resume`
- `POST /api/automation/loops/:id/cancel`
- `POST /api/automation/routines`
- `GET /api/automation/routines`
- `GET /api/automation/routines/:id`
- `POST /api/automation/routines/:id/run`
- `POST /api/automation/routines/:id/pause`
- `POST /api/automation/routines/:id/resume`
- `POST /api/automation/routines/:id/archive`
- `GET /api/automation/runs`
- `GET /api/automation/runs/:id`
- `GET /api/automation/approvals`
- `GET /api/automation/approvals/:id`
- `POST /api/automation/approvals/:id/approve`
- `POST /api/automation/approvals/:id/reject`
- `POST /api/automation/approvals/:id/handoff`

All responses are JSON-only.

## Tool Gateway Integration

- loops and routines may reference Tool Gateway tool ids
- Tool Gateway permission checks are reused before accepting automation definitions
- v0.1 automation creates approval-first automation run records rather than directly executing external actions
- approved automation runs can hand off into Tool Gateway call creation
- destructive and external tool handoff still results in Tool Gateway approval-first calls

## Audit and History

- create, pause, resume, cancel, archive, and run events are stored in local automation history
- reports are attached to automation run records
- approval, rejection, and handoff events are recorded in local history and audit

## Examples

- `examples/automation/morning-talocode-brief.json`
- `examples/automation/cliploop-weekly-promo.json`
- `examples/automation/stacklane-health-check.json`
- `examples/automation/codra-issue-triage.json`
- `examples/automation/postlane-email-draft.json`

## Limitations

- only active while the server or process is running
- no cloud-hosted routines
- no catch-up storm replay
- no arbitrary shell execution
- no direct publish or push actions
- manual approval remains required for every automation run
