# Talocode Agent-Native Protocol

A shared protocol for Talocode products so agents can safely inspect context, propose actions, request approval, execute approved actions, and write audit logs.

## Principles

1. **Agents do not control the app directly** — they request actions through a typed, permissioned, audited layer
2. **Read-only actions execute without approval** but are always audited
3. **Write actions require explicit human approval** before execution
4. **Destructive actions are unsupported** in v0.1
5. **No raw secrets** in action definitions, audit logs, or context providers
6. **Every action is typed** with input/output schemas

## Action Registry

Actions are typed definitions that agents can request. Each action specifies:

| Field | Description |
|-------|-------------|
| `id` | Unique action identifier (e.g., `github.create_issue`) |
| `product` | Which Talocode product owns this action |
| `type` | Action type string |
| `title` | Human-readable name |
| `inputSchema` | JSON Schema for input validation |
| `riskLevel` | `read`, `low`, `medium`, `high`, `destructive` |
| `readOnly` | Whether action modifies external state |
| `requiresApproval` | Whether human approval is needed |
| `requiredPermissions` | Permissions needed to execute |

### Current WorkLane Actions

| Action | Risk | Approval | Description |
|--------|------|----------|-------------|
| `github.list_issues` | read | no | List issues in a repo |
| `github.get_issue` | read | no | Get issue details |
| `github.list_issue_comments` | read | no | List issue comments |
| `github.search_issues` | read | no | Search issues across repos |
| `github.create_issue` | medium | yes | Create a new issue |
| `github.create_comment` | low | yes | Post a comment |

## Context Providers

Context providers expose app state to agents. Each specifies:

| Field | Description |
|-------|-------------|
| `id` | Provider identifier |
| `product` | Owning product |
| `provides` | List of capabilities |
| `privacyLevel` | `public`, `workspace`, `private`, `sensitive` |

### WorkLane Context Providers

| Provider | Privacy | Description |
|----------|---------|-------------|
| `worklane.agents` | workspace | Available agents |
| `worklane.knowledge` | workspace | Knowledge base |
| `worklane.connections` | private | Tool connections |
| `worklane.runs` | workspace | Task run history |
| `worklane.audit` | private | Audit trail |
| `github.issues` | public | GitHub issues |
| `github.issue_comments` | public | Issue comments |

## Permission Gates

Every action declares required permissions. Before execution:

1. Agent requests action
2. System checks required permissions against granted permissions
3. Missing permissions → rejection
4. Read-only actions → execute immediately (audited)
5. Write actions → require approval

## Run Lifecycle

```
draft → context_gathering → planning → pending_approval
  → approved → executing → completed
  → failed
  → cancelled
```

## Approval Model

- Read-only actions: no approval needed, always audited
- Write actions: approval required before execution
- Destructive actions: unsupported in v0.1
- Approval can be granted by workspace admin or designated reviewer

## Audit Model

Every action creates an audit event:

```json
{
  "runId": "run_xxx",
  "product": "worklane",
  "action": "github.create_issue",
  "actor": "agent-7f32",
  "result": "success",
  "metadata": { "owner": "talocode", "repo": "worklane", "issueNumber": 12 },
  "createdAt": "2026-06-23T..."
}
```

Metadata is sanitized — no tokens, passwords, or raw secrets.

## Versioning

Protocol version follows semantic versioning:

- `0.1.0` — Initial: action registry, context providers, permission gates
- `0.2.0` — Planned: approval workflows, run state machine
- `0.3.0` — Planned: cross-product protocol federation
- `1.0.0` — Stable protocol for production use

## Security Rules

- No raw secrets in action definitions or audit logs
- Read-only actions always audited
- Write actions require approval
- Destructive actions unsupported
- Context providers declare privacy levels
- Sensitive context requires explicit access grants
