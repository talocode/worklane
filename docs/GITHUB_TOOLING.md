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
| `github.list_issue_comments` | low | no | List comments on a GitHub issue |
| `github.search_issues` | low | no | Search issues across GitHub repositories |

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

## List Issue Comments

```bash
curl -X POST http://localhost:3001/api/agents/{agentId}/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "List comments on issue #12",
    "toolAction": "github.list_issue_comments",
    "toolInput": {
      "owner": "talocode",
      "repo": "worklane",
      "issueNumber": 12,
      "limit": 10
    },
    "executionMode": "live"
  }'

curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

### List Issue Comments Input

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `owner` | string | yes | — | GitHub owner or organization |
| `repo` | string | yes | — | Repository name |
| `issueNumber` | number | yes | — | Issue number |
| `limit` | number | no | `20` | Max comments to return (1-50) |

### List Issue Comments Output

Returns: owner, repo, issueNumber, count, comments[] (each with id, url, authorLogin, bodyPreview (max 500 chars), bodyLength, createdAt, updatedAt).

## Search Issues

Search across GitHub repositories using GitHub's search API.

```bash
curl -X POST http://localhost:3001/api/agents/{agentId}/run \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Search for auth bugs in worklane",
    "toolAction": "github.search_issues",
    "toolInput": {
      "query": "authentication bug",
      "owner": "talocode",
      "state": "open",
      "labels": ["bug"],
      "limit": 10
    },
    "executionMode": "live"
  }'

curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

### Search Issues Input

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | string | yes | — | Search query text (max 256 chars) |
| `owner` | string | no | — | Filter by owner or organization |
| `repo` | string | no | — | Filter by repository (requires owner) |
| `state` | string | no | `open` | `open`, `closed`, or `all` |
| `labels` | string[] | no | — | Filter by labels |
| `limit` | number | no | `20` | Max results (1-50) |
| `includePullRequests` | boolean | no | `false` | Include pull requests |

### Search Issues Output

Returns: query, count, totalCount, incompleteResults, issues[] (each with number, title, state, url, repositoryFullName, labels, createdAt, updatedAt, authorLogin, commentCount, isPullRequest, bodyPreview (max 300 chars), bodyLength).

### Search Query Behavior

WorkLane constructs GitHub search queries with these qualifiers:

- `is:issue` added by default (excludes pull requests)
- `state:open` or `state:closed` unless state is `all`
- `repo:owner/repo` when both owner and repo provided
- `org:owner` when only owner is provided
- `label:"name"` for each label filter

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
