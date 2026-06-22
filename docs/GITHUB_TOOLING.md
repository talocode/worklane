# GitHub Tooling

WorkLane's GitHub tool integration: creating issues, commenting, and inspecting issues through approval-first and read-only workflows.

## Available Actions

### Write Actions (Approval Required)

| Action | Risk | Approval | Description |
|--------|------|----------|-------------|
| `github.create_issue` | medium | yes | Create a new issue in a GitHub repository |
| `github.create_comment` | low | yes | Add a comment to an existing GitHub issue |

### Read-Only Actions (No Approval Required)

| Action | Risk | Approval | Description |
|--------|------|----------|-------------|
| `github.list_issues` | low | no | List issues in a GitHub repository |
| `github.get_issue` | low | no | Get details of a specific GitHub issue |

## How It Works

### Write Actions

1. User creates a task run with a write tool action
2. Run enters `pending_approval` status
3. User reviews and approves the run
4. User clicks Execute
5. WorkLane calls GitHub REST API
6. Result is logged in audit trail

### Read-Only Actions

1. User creates a task run with a read tool action
2. Run is created in `pending_approval` status
3. User clicks Execute (no approval step needed)
4. WorkLane calls GitHub REST API
5. Result is returned and logged in audit trail

## Configuration

Set the GitHub token as an environment variable:

```bash
export WORKLANE_GITHUB_TOKEN=ghp_your_token_here
```

### Required Token Permissions

- `repo` scope (for public and private repos)
- Or `public_repo` scope (for public repos only)

### Token Safety

- Token is read from `WORKLANE_GITHUB_TOKEN` env var only
- Token is never stored in `.worklane/` storage
- Token is never exposed in API responses
- Token is never logged in audit events
- Token is never printed to console

## List Issues

```bash
curl -X POST http://localhost:3001/api/agents/{agentId}/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "List open issues in worklane",
    "toolAction": "github.list_issues",
    "toolInput": {
      "owner": "talocode",
      "repo": "worklane",
      "state": "open",
      "limit": 10
    },
    "executionMode": "live"
  }'

curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

### List Issues Input

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `owner` | string | yes | — | GitHub owner or organization |
| `repo` | string | yes | — | Repository name |
| `state` | string | no | `open` | `open`, `closed`, or `all` |
| `labels` | string[] | no | — | Filter by labels |
| `limit` | number | no | `20` | Max issues to return (1-50) |
| `includePullRequests` | boolean | no | `false` | Include pull requests |

### List Issues Output

Returns normalized issue objects with: number, title, state, url, labels, createdAt, updatedAt, authorLogin, commentCount, isPullRequest.

Pull requests are excluded by default (they appear in the GitHub issues endpoint).

## Get Issue

```bash
curl -X POST http://localhost:3001/api/agents/{agentId}/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Get issue #12 from worklane",
    "toolAction": "github.get_issue",
    "toolInput": {
      "owner": "talocode",
      "repo": "worklane",
      "issueNumber": 12
    },
    "executionMode": "live"
  }'

curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

### Get Issue Output

Returns: number, title, bodyPreview (max 500 chars), bodyLength, state, url, labels, createdAt, updatedAt, authorLogin, commentCount, isPullRequest, locked, assignees.

## Create Issue

```bash
curl -X POST http://localhost:3001/api/agents/{agentId}/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create issue: Fix login bug",
    "toolAction": "github.create_issue",
    "toolInput": {
      "owner": "talocode",
      "repo": "worklane",
      "title": "Fix login bug",
      "body": "Users cannot log in when...",
      "labels": ["bug", "auth"]
    },
    "executionMode": "live"
  }'

curl -X POST http://localhost:3001/api/runs/{runId}/approve
curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

## Comment on Issue

```bash
curl -X POST http://localhost:3001/api/agents/{agentId}/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Comment on issue #12",
    "toolAction": "github.create_comment",
    "toolInput": {
      "owner": "talocode",
      "repo": "worklane",
      "issueNumber": 12,
      "body": "This has been fixed in the latest commit."
    },
    "executionMode": "live"
  }'

curl -X POST http://localhost:3001/api/runs/{runId}/approve
curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

## Error Handling

WorkLane classifies GitHub API errors into safe error codes:

| Code | Meaning |
|------|---------|
| `missing_token` | WORKLANE_GITHUB_TOKEN not set |
| `unauthorized` | Invalid or expired token |
| `forbidden` | Insufficient permissions |
| `not_found` | Repository or resource not found |
| `validation_error` | Invalid input |
| `rate_limited` | GitHub API rate limit exceeded |
| `network_error` | Network connectivity issue |
| `timeout` | Request timed out |

### Retries

WorkLane automatically retries on transient failures (network errors, timeouts, 5xx) with exponential backoff (max 2 retries, 500ms-3s delay). Validation, auth, and not-found errors are not retried.

## Audit Logging

Every action is logged with safe metadata:

- Write actions: `tool.execution.started`, `tool.execution.completed`, `tool.execution.failed`
- Read-only actions: `tool.read.started`, `tool.read.completed`, `tool.read.failed`

Audit events never include tokens, authorization headers, or raw request bodies.

## Limitations (v0.1)

- Only `create_issue`, `create_comment`, `list_issues`, `get_issue` implemented
- No issue editing, closing, or deleting
- No pull request operations
- No repository management
- No webhook integration
- Single token per workspace
- No multi-token support
