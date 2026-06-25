# Tool Gateway

WorkLane Tool Gateway provides a provider-agnostic tool registry and execution gateway.

It lets builders configure tool sources once, normalize them into a common schema, apply approval-first permissions, and use them safely from WorkLane runs and future clients.

In v0.1, Loops & Routines can reference Tool Gateway tool ids, but automation still creates approval-first run records instead of directly executing external actions.

Automation approvals can hand off approved runs into Tool Gateway call creation. That handoff still respects source enabled state, tool enabled state, auth configuration checks, and Tool Gateway approval rules.

Approved Tool Gateway calls can then be moved into Execution Queue for visible review and safe placeholder execution when supported.

## What it is

Tool Gateway adds one normalized interface for:

- local tools
- Talocode placeholder tools
- HTTP source definitions
- OpenAPI placeholder sources
- MCP placeholder sources

v0.1 focuses on registration, permissions, storage, approval, audit logging, and deterministic execution.

## Source Types

- `local`
- `http`
- `openapi`
- `mcp`
- `talocode`

## Tool Normalization

Every tool is normalized into a shared record with:

- source id
- stable tool name
- display name
- description
- input schema
- optional output schema
- risk level
- approval requirement
- enabled state
- tags

Talocode tools are registered as safe placeholders by default.

## Permissions

- `read` tools may run without approval in deterministic mode
- `write` tools require approval
- `destructive` tools require explicit approval
- `external` tools require approval
- disabled tools cannot run
- disabled sources cannot run
- missing auth environment variables return safe errors
- there is no approval bypass

## Execution Model

Execution in v0.1 is intentionally narrow:

- Talocode tools return deterministic placeholder results
- HTTP, OpenAPI, and MCP shapes can be configured
- unconnected sources return safe "not connected yet" responses
- arbitrary shell execution is not supported

## Local Storage

Tool Gateway stores data locally in:

```text
.worklane/tool-gateway/sources.json
.worklane/tool-gateway/tools.json
.worklane/tool-gateway/calls.json
```

Stored auth data includes environment variable names only, never values.

## Default Talocode Tools

- `talocode.launchpix.asset.plan`
- `talocode.cliploop.director.plan`
- `talocode.postlane.email.draft`
- `talocode.stacklane.project.inspect`
- `talocode.worklane.run.create`

These are placeholder planning and inspection tools in v0.1.

## API Endpoints

- `GET /api/tool-gateway/health`
- `GET /api/tool-gateway/sources`
- `POST /api/tool-gateway/sources`
- `GET /api/tool-gateway/tools`
- `POST /api/tool-gateway/tools/register`
- `POST /api/tool-gateway/calls`
- `GET /api/tool-gateway/calls`
- `GET /api/tool-gateway/calls/:id`
- `POST /api/tool-gateway/calls/:id/approve`
- `POST /api/tool-gateway/calls/:id/queue`
- `POST /api/tool-gateway/calls/:id/run`

All responses are JSON-only.

## Env Var Handling

- Tool Gateway stores env var names only
- Tool Gateway never stores raw token values
- Missing env vars return safe configuration errors
- UI only shows config present or missing

## Limitations

- no arbitrary shell execution
- no full OpenAPI parsing yet
- no real MCP execution yet
- no external marketplace
- no billing layer
- placeholder Talocode tools only in v0.1
- execution queue adds the visible post-approval layer, but only safe supported placeholder handlers can run in v0.1
