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

### POST /api/runs/:id/execute
> ✅ Implemented

Execute an approved task run. Runs tool actions if configured.

**Response (real execution):**
```json
{
  "ok": true,
  "run": { "..." },
  "execution": {
    "mode": "real",
    "provider": "github",
    "action": "github.create_issue",
    "result": {
      "issueNumber": 12,
      "title": "Fix login bug",
      "url": "https://github.com/talocode/worklane/issues/12"
    }
  }
}
```

**Response (simulated execution):**
```json
{
  "ok": true,
  "run": { "..." },
  "execution": { "mode": "simulated" }
}
```

---

## Tools

### GET /api/tools
> ✅ Implemented

List available tool actions.

**Response:**
```json
{
  "ok": true,
  "actions": [
    {
      "id": "github.create_issue",
      "provider": "github",
      "name": "Create GitHub Issue",
      "description": "Create a new issue in a GitHub repository",
      "riskLevel": "medium",
      "requiresApproval": true
    }
  ]
}
```

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
