# Product

## Problem

Teams using AI agents today face fragmentation: agents live in separate tools, knowledge is scattered, connections require per-user setup, and there's no centralized way to see what agents are doing or approve their actions.

## Target Users

- Small teams (2-20 people) building with AI agents
- Dev teams automating recurring workflows
- Operations teams managing cross-tool processes
- Solo builders who want structured agent management

## Core Use Cases

1. **Create a team agent for weekly reports** — Define an agent once, share it with the team, run it on a schedule
2. **Connect a tool once and share access** — Set up a Slack/GitHub/etc connection, share with team members without exposing secrets
3. **Run recurring operations with approval** — Schedule agent tasks that require human sign-off before execution
4. **Store workspace knowledge** — Keep processes, brand guidelines, and context in a shared knowledge base agents can reference
5. **Review every agent action** — Full audit trail of what agents did, when, and with what approval

## MVP Scope (v0.1)

- Agent registry (create, list, run agents)
- Knowledge base (add, list, search knowledge items)
- Connection registry (add, list, test connections — secrets stored as references, not plaintext)
- Task runs with approval workflow
- Audit logging
- Dashboard UI
- Local JSON storage (no DB dependency)
- Simulated execution when tools aren't connected

## Non-Goals (v0.1)

- All actions visible — nothing runs without your knowledge
- No bypassing user permissions
- Honest execution labeling — simulated execution is clearly labeled
- No autonomous destructive actions without approval
- No cloud-hosted SaaS — self-hostable only
- No claiming capabilities that aren't implemented

## Roadmap

### v0.1 — Foundation
- Agent registry, knowledge base, connections, task runs, approvals, audit logs
- Dashboard UI
- Local JSON storage
- Simulated execution

### v0.2 — Real Tool Execution
- GitHub, Slack, email integrations
- Real API execution for connected tools
- MCP server support

### v0.3 — Scheduling & Triggers
- Cron-based triggers
- Event-based triggers (webhook, file change)
- Recurring task management

### v0.4 — Team Features
- Multi-user workspaces
- Role-based permissions
- Shared agent instances
- Usage tracking

### v0.5 — Agent-Generated Apps
- Dashboard/report generation from agent output
- Template-based app creation
- Data visualization from agent results
