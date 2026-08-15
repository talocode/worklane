# WorkLane Maintainer

WorkLane Maintainer prepares bounded, approval-first repository maintenance runs and gives every run an explicit evidence contract.

The initial release does not inspect repositories or generate patches by itself. It creates a simulated run, records hard limits, links the request to WorkLane automation approval records, and waits for an approved repository execution tool.

## Why It Exists

Recurring maintenance is useful only when teams can review what was found, reproduce the problem, inspect the smallest proposed change, and verify the result. Maintainer makes those receipts part of the run contract instead of optional prose.

## Built-In Routines

| Routine | Purpose | Default cadence |
| --- | --- | --- |
| `flaky-test-diagnosis` | Reproduce intermittent failures and propose a root-cause fix | daily |
| `dead-code-candidates` | Produce evidence-backed candidates without automatic deletion | weekly |
| `duplicate-implementation-detection` | Find diverging behavior and propose a bounded unification plan | weekly |

All routines use `draft_only` permissions and require human approval.

## Evidence Contract

Each run exposes:

- reproduction
- root cause
- proposed change
- files changed
- verification commands and outcomes
- risks
- confidence
- rollback path
- unresolved items

Before connected execution, `evidenceStatus` is `not_collected`, evidence fields are empty, and `executionMode` is `simulated`. Approving a run authorizes a handoff only. Approval never fabricates repository findings or marks verification complete.

## Safety Limits

Every run has hard bounds:

- `maxFiles`: 1 to 500, default 20
- `maxPatchLines`: 1 to 5,000, default 300
- `maxRuntimeMinutes`: 1 to 120, default 20
- repository identifiers must use `owner/repository` format
- base references reject traversal and unsupported characters

Maintainer never pushes, merges, publishes, deploys, or deletes without explicit approval. A run cannot approve or merge its own work.

## CLI

```bash
worklane maintenance routines

worklane maintenance run \
  --routine flaky-test-diagnosis \
  --repo talocode/worklane \
  --base-ref main \
  --max-files 20

worklane maintenance report <run-id>
worklane maintenance approve <run-id>
```

## API

Hosted and self-hosted API routes use the WorkLane namespace:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/v1/worklane/maintenance/routines` | List built-in routines |
| `GET` | `/v1/worklane/maintenance/runs` | List maintenance runs |
| `POST` | `/v1/worklane/maintenance/runs` | Prepare an approval-first run |
| `GET` | `/v1/worklane/maintenance/runs/:id` | Read a run |
| `GET` | `/v1/worklane/maintenance/runs/:id/report` | Read its evidence contract |
| `POST` | `/v1/worklane/maintenance/runs/:id/approve` | Approve the run for handoff |
| `POST` | `/v1/worklane/maintenance/runs/:id/reject` | Reject the run |

Example request:

```json
{
  "routineId": "flaky-test-diagnosis",
  "repo": "talocode/worklane",
  "baseRef": "main",
  "maxFiles": 20,
  "maxPatchLines": 300,
  "maxRuntimeMinutes": 20
}
```

Dashboard-local equivalents are available under `/api/maintenance/*`.

## Dashboard

Open `/dashboard/maintainer` to choose a routine, set repository limits, prepare a run, inspect the evidence contract, and approve or reject the handoff.

## Current Limitations

- Repository execution is simulated until a compatible tool is connected.
- Reports begin empty and do not claim findings before execution.
- Approval records intent to hand off; it does not execute shell commands.
- Real patches still require the Tool Gateway, execution queue, automated checks, and human review.
