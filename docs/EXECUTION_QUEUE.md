# Execution Queue

WorkLane Execution Queue adds the visible execution-review layer after Tool Gateway call approval.

It lets builders review approved calls, run only safe supported placeholder handlers, mark manual follow-up, and keep the full automation chain visible.

## Queue Lifecycle

- `queued`
- `ready`
- `blocked`
- `running`
- `succeeded`
- `failed`
- `manual_required`
- `cancelled`

In v0.1, queue visibility is broader than run eligibility. A call may be visible in queue while still blocked from execution.

## Safe Execution Rules

- only approved Tool Gateway calls should be explicitly queued for execution
- disabled sources block execution
- disabled tools block execution
- missing auth configuration blocks execution safely
- destructive tools must not auto-run
- external tools must not auto-run
- unsupported tools should become `manual_required`
- arbitrary shell execution is not supported
- no raw token or env value is stored or returned

## Supported v0.1 Execution

- safe deterministic Talocode placeholder read handlers can run
- unsupported local, write, destructive, and external flows remain blocked or manual
- if a call cannot run safely, the queue item stays auditable with a manual reason

## Automation Chain

Execution Queue is designed to keep this visible chain intact:

```text
Routine / Loop
-> Automation Run
-> Approval
-> Tool Gateway Call
-> Execution Queue
-> Result or Manual Follow-up
```

Automation approvals can create Tool Gateway calls and surface them into queue without executing them.

## Local Storage

Execution Queue stores data locally in:

```text
.worklane/execution/queue.json
.worklane/execution/history.json
```

Tool Gateway call storage remains in:

```text
.worklane/tool-gateway/calls.json
```

## API Endpoints

- `GET /api/execution/health`
- `GET /api/execution/queue`
- `GET /api/execution/queue/:id`
- `POST /api/execution/queue/:id/run`
- `POST /api/execution/queue/:id/manual`
- `POST /api/execution/queue/:id/cancel`
- `GET /api/execution/history`
- `POST /api/tool-gateway/calls/:id/queue`

All responses are JSON-only.

## Dashboard

`/dashboard/execution` shows:

- queued items
- ready items
- blocked items
- manual-required items
- recent results

Each item shows queue state, risk level, approval state, timing, warnings, and result/error summary when available.

## Audit and History

- queue creation writes execution history and shared audit events
- runs write started/succeeded/failed events
- manual-required and cancel actions are recorded
- no secrets are stored in queue history or audit metadata

## Limitations

- only supported placeholder handlers run in v0.1
- no arbitrary shell execution
- no real destructive execution
- no real external API execution unless a safe supported path already exists
- queue review is local-first and depends on the running WorkLane process
