# Execution Queue

WorkLane Execution Queue is the local-first review and run layer for approved Tool Gateway calls.

It keeps the chain visible:

Routine or Loop
-> Automation Run
-> Approval
-> Tool Gateway Call
-> Execution Queue
-> Result or Manual

## Queue Lifecycle

- `queued`
- `ready`
- `blocked`
- `running`
- `succeeded`
- `failed`
- `manual_required`
- `cancelled`

## Safe Execution Rules

- only approved Tool Gateway calls can be queued for execution run requests
- safe placeholder read tools can run
- destructive tools do not auto-run
- external tools do not auto-run
- unsupported tools become `manual_required`
- disabled sources or tools become `blocked`
- missing auth configuration becomes `blocked`
- arbitrary shell execution is not supported

## Manual Required

Use `manual_required` when:

- the tool is unsupported for safe automatic execution
- the tool risk is too high
- a builder must complete the step outside WorkLane

## Storage

Execution queue data is stored locally in:

```text
.worklane/execution/queue.json
.worklane/execution/history.json
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

## Limitations

- only safe placeholder read execution is supported in v0.1
- no cloud queue
- no background worker
- no automatic destructive execution
- no arbitrary shell commands
