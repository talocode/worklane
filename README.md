# WorkLane

**Open-source command center for team agents, shared knowledge, tool connections, and recurring work.**

Self-hostable. Provider-agnostic. Built by Talocode.

## What is WorkLane?

WorkLane is a local-first command center where teams can create agents, share knowledge, connect tools, and run recurring work with approval-first automation. Every agent action is logged in an audit trail. All actions are visible. Permissions are always enforced.

## Features

- **Agent Registry** — Create, share, and run team agents
- **Knowledge Base** — Store processes, brand context, and institutional knowledge
- **Connection Registry** — Connect tools once, share access without exposing secrets
- **Task Runs** — Run agent tasks with approval gates and audit trails
- **Tool Gateway** — Register approved tools once and expose them through one normalized interface
- **Loops & Routines** — Turn repeatable work into local-first, approval-first automations
- **Loop Starter Kits** — Reusable loop engineering patterns for triage, CI sweeps, PR babysitting, and more
- **Automation Approvals** — Review pending automation runs before any handoff happens
- **Execution Queue** — Review approved tool calls, run safe placeholders, or mark manual handoff
- **WorkLane Maintainer** — Prepare bounded code-maintenance runs with explicit evidence contracts
- **Approval-First** — Destructive actions require explicit human approval
- **Audit Logging** — Every agent action recorded and reviewable
- **Simulated Execution** — Clear labeling when tools aren't connected
- **Local-First Storage** — Data stays on your machine (JSON in v0.1)
- **Self-Hostable** — Run on your own infrastructure

## Quick Start

```bash
# Install
npm install -g @talocode/worklane

# Initialize
worklane init

# Run from CLI
worklane run "summarize this discussion"
```

## WorkLane Maintainer

Maintainer prepares bounded repository-maintenance runs with explicit evidence requirements and human approval before handoff.

```bash
worklane maintenance routines

worklane maintenance run \
  --routine flaky-test-diagnosis \
  --repo talocode/worklane \
  --max-files 20
```

The initial release supports flaky-test diagnosis, dead-code candidates, and duplicate-implementation detection. Runs start with `executionMode: "simulated"` and `evidenceStatus: "not_collected"`; WorkLane does not claim repository findings until a compatible execution tool is connected.

Self-hosted API routes are available under `/v1/worklane/maintenance/*`. See [WorkLane Maintainer](docs/MAINTAINER.md) for the full route table, limits, evidence contract, and safety model.

## Dashboard

```bash
cd apps/dashboard
npm install
npm run dev
```

Open `http://localhost:3001` for the command center dashboard.

## Architecture

```
Dashboard (Next.js)
    ↓
API Routes
    ↓
WorkLane Data Library
    ↓
Local JSON Storage (.worklane/*.json)
```

## Safety Model

- Secrets stored as references only — never raw credentials
- Destructive actions require explicit approval
- All actions logged in immutable audit trail
- Local-first: data stays on your machine
- No external data transmission without consent
- Simulated execution clearly labeled when tools aren't connected
- Honest execution labeling — only real or simulated

## What's Implemented Now (v0.1)

- Agent registry (create, list, run)
- Knowledge base (add, list, search)
- Connection registry (add, list — secrets as references)
- Task runs with approval workflow
- Audit logging
- Tool Gateway with normalized source and tool records
- Loops and routines with local scheduler foundations
- Loop starter kits with approval-first routine draft instantiation
- Execution Queue review layer
- WorkLane Maintainer with flaky-test, dead-code candidate, and duplicate-implementation routines
- Dashboard UI
- Local JSON storage
- Simulated execution

## What's Planned

- Real tool execution (GitHub, Slack, email)
- MCP server support
- Schedule and event-based triggers
- Multi-user workspaces
- Role-based permissions
- Agent-generated dashboards and apps

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE_COMMAND_CENTER.md)
- [Data Model](docs/DATA_MODEL.md)
- [API](docs/API_COMMAND_CENTER.md)
- [Agents](docs/AGENTS.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Tool Gateway](docs/TOOL_GATEWAY.md)
- [Loops & Routines](docs/LOOPS_AND_ROUTINES.md)
- [Loop Starter Kits](docs/LOOP_STARTER_KITS.md)
- [Execution Queue](docs/EXECUTION_QUEUE.md)
- [WorkLane Maintainer](docs/MAINTAINER.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Support Talocode

Talocode builds open-source workflow layers for builders: coding agents, learning tools, trading intelligence, video workflows, and local-first automation.

If WorkLane helps you, you can support the work here:

[![Sponsor Abdulmuiz44](https://img.shields.io/badge/Sponsor-Abdulmuiz44-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/Abdulmuiz44)

## Talocode ecosystem

| Product | Purpose |
| --- | --- |
| [WorkLane](https://github.com/talocode/worklane) **(this repo)** | Approval-first team agents and recurring work |
| [Tera](https://github.com/talocode/tera) | General capability and learning workflows |
| [StackLane](https://github.com/talocode/stacklane) | Projects, API keys, credits, usage, and billing |
| [Codra](https://github.com/talocode/codra) | Coding workflows |
| [ClipLoop](https://github.com/talocode/cliploop) | Video production workflows |
| [SearchLane](https://github.com/talocode/searchlane) | Search workflows |
| [VerifyLane](https://github.com/talocode/verifylane) | Verification workflows |
| [TraceLane](https://github.com/talocode/tracelane) | Agent execution tracing |
| [PolicyLane](https://github.com/talocode/policylane) | Policy enforcement |
| [SpendCaps](https://github.com/talocode/spendcaps) | Agent spend controls |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## License

MIT © Talocode
