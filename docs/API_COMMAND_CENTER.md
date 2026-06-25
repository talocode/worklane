# API

Base URL: `/api`

## Status Key

- ✅ Implemented in v0.1
- 🔜 Planned

---

## Workspace

### GET /api/workspaces/current
> 🔜 Planned

Returns the current workspace info.

**Response:**
```json
{ "ok": true, "workspace": { "id": "ws_default", "name": "Default Workspace" } }
```

---

## Agents

### GET /api/agents
> ✅ Implemented

List all agents in the workspace.

**Response:**
```json
{
  "ok": true,
  "agents": [
    { "id": "ag_xxx", "name": "Research Agent", "description": "...", "skills": ["research"], "status": "active" }
  ]
}
```

### POST /api/agents
> ✅ Implemented

Create a new agent.

**Request:**
```json
{ "name": "Weekly Reporter", "description": "Generates weekly reports", "skills": ["reporting"] }
```

### POST /api/agents/:id/run
> ✅ Implemented

Run a task with an agent.

**Request:**
```json
{ "task": "Generate this week's sales summary" }
```

**Response:**
```json
{
  "ok": true,
  "run": {
    "id": "run_xxx",
    "status": "pending_approval",
    "executionMode": "simulated",
    "riskLevel": "low",
    "plan": [...]
  }
}
```

---

## Knowledge

### GET /api/knowledge
> ✅ Implemented

List knowledge documents.

### POST /api/knowledge
> ✅ Implemented

Add a knowledge document.

**Request:**
```json
{ "title": "Brand Voice Guide", "content": "...", "tags": ["brand", "voice"], "category": "guidelines" }
```

---

## Connections

### GET /api/connections
> ✅ Implemented

List connections (secrets never exposed in response).

### POST /api/connections
> ✅ Implemented

Add a connection placeholder.

**Request:**
```json
{ "name": "GitHub", "type": "github", "config": { "repo": "org/repo" } }
```

**Response:**
```json
{ "ok": true, "connection": { "id": "conn_xxx", "status": "inactive", "secretRef": "ref_xxx" } }
```

### POST /api/connections/:id/test
> 🔜 Planned

Test connection health.

---

## Task Runs

### GET /api/runs
> ✅ Implemented

List task runs.

### GET /api/runs/:id
> ✅ Implemented

Get task run details.

### POST /api/runs/:id/approve
> ✅ Implemented

Approve a task run.

**Request:**
```json
{ "notes": "Approved for execution" }
```

### POST /api/runs/:id/cancel
> ✅ Implemented

Cancel a task run.

---

## Triggers

### GET /api/triggers
> ✅ Implemented

List triggers.

### POST /api/triggers
> ✅ Implemented

Create a trigger.

**Request:**
```json
{ "name": "Weekly Report", "type": "schedule", "agentId": "ag_xxx", "task": "...", "schedule": "0 8 * * 1" }
```

---

## Audit

### GET /api/audit
> ✅ Implemented

List audit events.

**Query params:** `?limit=50&offset=0&actorType=agent&action=run.created`

---

## Tool Gateway

### GET /api/tool-gateway/health
> ✅ Implemented

Return Tool Gateway status and storage paths.

### GET /api/tool-gateway/sources
> ✅ Implemented

List configured sources.

### POST /api/tool-gateway/sources
> ✅ Implemented

Create a source using auth metadata only. Store env var names, never values.

### GET /api/tool-gateway/tools
> ✅ Implemented

List normalized tools, including default Talocode placeholder tools.

### POST /api/tool-gateway/tools/register
> ✅ Implemented

Register a local or configured tool definition.

### POST /api/tool-gateway/calls
> ✅ Implemented

Create a tool call and apply approval rules.

### GET /api/tool-gateway/calls
> ✅ Implemented

List tool calls.

### GET /api/tool-gateway/calls/:id
> ✅ Implemented

Get one tool call.

### POST /api/tool-gateway/calls/:id/approve
> ✅ Implemented

Approve a pending tool call.

### POST /api/tool-gateway/calls/:id/queue
> ✅ Implemented

Queue an approved Tool Gateway call for execution review.

### POST /api/tool-gateway/calls/:id/run
> ✅ Implemented

Execute a deterministic placeholder handler or return a safe not-connected result.

---

## Execution Queue

### GET /api/execution/health
> ✅ Implemented

Return execution queue status and storage paths.

### GET /api/execution/queue
> ✅ Implemented

List execution queue items.

### GET /api/execution/queue/:id
> ✅ Implemented

Get one execution queue item.

### POST /api/execution/queue/:id/run
> ✅ Implemented

Run an execution queue item only when it is safe and supported.

### POST /api/execution/queue/:id/manual
> ✅ Implemented

Mark a queue item as manual-required with optional reason.

### POST /api/execution/queue/:id/cancel
> ✅ Implemented

Cancel a queued, ready, blocked, or manual-required queue item.

### GET /api/execution/history
> ✅ Implemented

List local execution queue history.

---

## Loops & Routines

### GET /api/automation/health
> ✅ Implemented

Return local automation health and loop constraints.

### POST /api/automation/loops
> ✅ Implemented

Create a loop.

### GET /api/automation/loops
> ✅ Implemented

List loops.

### GET /api/automation/loops/:id
> ✅ Implemented

Get one loop.

### POST /api/automation/loops/:id/pause
> ✅ Implemented

Pause a loop.

### POST /api/automation/loops/:id/resume
> ✅ Implemented

Resume a loop.

### POST /api/automation/loops/:id/cancel
> ✅ Implemented

Cancel a loop.

### POST /api/automation/routines
> ✅ Implemented

Create a routine.

### GET /api/automation/routines
> ✅ Implemented

List routines.

### GET /api/automation/routines/:id
> ✅ Implemented

Get one routine.

### POST /api/automation/routines/:id/run
> ✅ Implemented

Create a manual routine run in pending approval state.

### POST /api/automation/routines/:id/pause
> ✅ Implemented

Pause a routine.

### POST /api/automation/routines/:id/resume
> ✅ Implemented

Resume a routine.

### POST /api/automation/routines/:id/archive
> ✅ Implemented

Archive a routine.

### GET /api/automation/runs
> ✅ Implemented

List automation runs. A scheduler tick may create new pending approval runs while the server is active.

### GET /api/automation/runs/:id
> ✅ Implemented

Get one automation run.

### GET /api/automation/approvals
> ✅ Implemented

List pending and recent automation approval runs.

### GET /api/automation/approvals/:id
> ✅ Implemented

Get one automation approval detail.

### POST /api/automation/approvals/:id/approve
> ✅ Implemented

Mark an automation run approved.

### POST /api/automation/approvals/:id/reject
> ✅ Implemented

Mark an automation run rejected with optional reason.

### POST /api/automation/approvals/:id/handoff
> ✅ Implemented

Hand an approved automation run off to Tool Gateway or mark manual handoff required.

---

## Execution Queue

### GET /api/execution/health
> ✅ Implemented

Return execution queue status and storage paths.

### GET /api/execution/queue
> ✅ Implemented

List queue items across ready, blocked, manual, running, and completed states.

### GET /api/execution/queue/:id
> ✅ Implemented

Get one queue item.

### POST /api/execution/queue/:id/run
> ✅ Implemented

Run a queue item only when safe.

### POST /api/execution/queue/:id/manual
> ✅ Implemented

Mark an item as manual required.

### POST /api/execution/queue/:id/cancel
> ✅ Implemented

Cancel a queued or reviewable item.

### GET /api/execution/history
> ✅ Implemented

List execution queue history.

### POST /api/tool-gateway/calls/:id/queue
> ✅ Implemented

Queue an approved Tool Gateway call for execution review.
