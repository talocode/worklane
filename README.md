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
- **Automation Approvals** — Review pending automation runs before any handoff happens
- **Execution Queue** — Review approved tool calls, run safe placeholders, or mark manual handoff
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
- Execution Queue review layer
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
- [Execution Queue](docs/EXECUTION_QUEUE.md)

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

## License

MIT © Talocode
