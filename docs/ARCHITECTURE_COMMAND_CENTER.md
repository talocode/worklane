# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard (Next.js)                   │
│  /dashboard/agents  /knowledge  /connections  /runs     │
└──────────────────────────┬──────────────────────────────┘
                           │ API calls
┌──────────────────────────▼──────────────────────────────┐
│                    API Routes (Next.js)                  │
│  /api/agents  /api/knowledge  /api/connections  /api/runs│
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  WorkLane Core Library                    │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Agents   │ │Knowledge │ │Connections│ │  Runs    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │             │          │
│  ┌────▼────────────▼────────────▼─────────────▼────┐   │
│  │              Local JSON Storage                  │   │
│  │         .worklane/*.json (v0.1)                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Approvals│ │  Audit   │ │Triggers  │ │ Secrets  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Workspace
- Top-level container for all entities
- Contains members, agents, knowledge, connections
- v0.1: single default workspace

### Agent Registry
- Store agent definitions (name, description, skills, configuration)
- List, create, update agents
- Run agent tasks
- Track agent execution history

### Knowledge Base
- Store documents, processes, brand context
- Tag and categorize knowledge items
- Agents reference knowledge during execution

### Connection Registry
- Store tool connection metadata (name, type, status)
- Secret references (not plaintext storage)
- Test connection health
- Share connections across team members

### Task Runs
- Accept plain English task descriptions
- Create execution plans (deterministic in v0.1)
- Require approval before execution
- Track execution status and results
- Support simulated execution when tools aren't connected

### Approvals
- Every task run requires approval gate
- Risk level assessment (low/medium/high)
- Required permissions check
- Approval status tracking

### Audit Log
- Record every agent action
- Include timestamp, actor, action, result
- Searchable and filterable
- Immutable once written

### Triggers
- Schedule-based (cron)
- Event-based (webhook, file change)
- Manual trigger
- v0.1: manual only

### Secrets Vault
- Store encrypted secret references
- Never store raw credentials — only references
- Provide secret values to agents at runtime
- v0.1: placeholder with reference IDs

## Data Flow

```
User creates task
  → Task run created
  → Plan steps generated
  → Approval required (if risk > low)
  → User approves
  → Execution begins (simulated or real)
  → Audit events logged
  → Result returned
  → Optional: trigger next action
```

## Security Model

- Credentials stored as references only
- Destructive actions require explicit approval
- All actions logged in audit trail
- Local-first: data stays on user's machine in v0.1
- No external data transmission without user consent
