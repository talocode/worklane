# GitHub Tooling

WorkLane's first real tool integration: creating GitHub issues through approval-first automation.

## How It Works

1. User creates a task run with `toolAction: "github.create_issue"`
2. Run enters `pending_approval` status
3. User reviews and approves the run
4. User clicks Execute (or system executes after approval)
5. WorkLane calls GitHub REST API to create the issue
6. Result is logged in audit trail
7. Issue URL is returned to the user

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
# Create an agent first
curl -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "GitHub Agent", "description": "Creates GitHub issues"}'

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

### Via Dashboard

1. Go to `/dashboard/runs`
2. Select an agent
3. Fill in Owner, Repo, Title, Body, Labels
4. Click "Create Issue Run"
5. Approve the run
6. Click "Execute"

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

## Audit Logging

Every step is logged:

- `run.created` — when the run is created
- `run.approved` — when the user approves
- `tool.execution.started` — when execution begins
- `tool.execution.completed` — on success
- `tool.execution.failed` — on failure
- `run.completed` — final status

Audit events never include the GitHub token.

## Limitations (v0.1)

- Only `github.create_issue` is implemented
- No issue editing, closing, or commenting
- No pull request operations
- No repository management
- No branch operations
- No GitHub Actions triggers
- Single token per workspace
- No rate limit handling
- No webhook integration

## What's Not Implemented Yet

- Issue updates and comments
- Pull request creation
- Branch management
- GitHub Actions triggers
- Webhook receivers
- Multi-token support
- Rate limit backoff
- GitHub App authentication
