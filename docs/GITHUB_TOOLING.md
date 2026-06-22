# GitHub Tooling

WorkLane's approved GitHub tool integration: creating issues and commenting on issues through approval-first automation.

## Available Actions

### Create GitHub Issue

Creates a new issue in a GitHub repository.

- **Risk level**: medium
- **Requires approval**: yes
- **Input**: owner, repo, title, body (optional), labels (optional)

### Comment on GitHub Issue

Adds a comment to an existing GitHub issue.

- **Risk level**: low
- **Requires approval**: yes
- **Input**: owner, repo, issueNumber, body

## How It Works

1. User creates a task run with a tool action
2. Run enters `pending_approval` status
3. User reviews and approves the run
4. User clicks Execute
5. WorkLane calls GitHub REST API
6. Result is logged in audit trail
7. Issue/comment URL is returned

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

## Creating a GitHub Issue

### Via API

```bash
# Create a run with tool action
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

# Approve the run
curl -X POST http://localhost:3001/api/runs/{runId}/approve

# Execute the run
curl -X POST http://localhost:3001/api/runs/{runId}/execute
```

## Commenting on a GitHub Issue

### Via API

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
```

## Approval Flow

```
Run created (pending_approval)
  → User reviews task and tool input
  → User approves
  → User clicks Execute
  → GitHub API called
  → Result logged in audit
  → Run completed or failed
```

## Error Handling

WorkLane classifies GitHub API errors into safe error codes:

| Code | Meaning |
|------|---------|
| `missing_token` | WORKLANE_GITHUB_TOKEN not set |
| `unauthorized` | Invalid or expired token |
| `forbidden` | Insufficient permissions |
| `not_found` | Repository or resource not found |
| `validation_error` | Invalid input (bad issue number, missing fields) |
| `rate_limited` | GitHub API rate limit exceeded |
| `network_error` | Network connectivity issue |
| `timeout` | Request timed out |

### Retries

WorkLane automatically retries on transient failures:

- Network errors
- Timeouts
- Server errors (5xx)

Retries use exponential backoff:
- Max 2 retries
- Base delay: 500ms
- Max delay: 3000ms

WorkLane does NOT retry:
- Validation errors (422)
- Authentication errors (401)
- Permission errors (403)
- Not found errors (404)

## Audit Logging

Every step is logged with safe metadata:

- `tool.execution.started` — includes action type, owner, repo (no token)
- `tool.execution.completed` — includes action type, result summary
- `tool.execution.failed` — includes action type, error code (no sensitive details)

Audit events never include:
- GitHub tokens
- Authorization headers
- Full request/response bodies
- Raw API credentials

## Rate Limiting

When GitHub returns a rate limit error:
- WorkLane returns the `rate_limited` error code
- Includes `retryAfterSeconds` hint if available
- User can wait and retry manually

## Limitations (v0.1)

- Only `github.create_issue` and `github.create_comment` are implemented
- No issue editing, closing, or deleting
- No pull request operations
- No repository management
- No branch operations
- No GitHub Actions triggers
- No webhook integration
- Single token per workspace
- No multi-token support
- No GitHub App authentication
