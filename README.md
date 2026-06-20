# WorkLane

**Open-source AI coworker platform for teams.**

Mention agents in chat. Route work. Return finished output.  
Self-hostable. Provider-agnostic. Built by Talocode.

## What is WorkLane?

WorkLane lets teams mention AI agents inside chat tools and get real work done without opening another dashboard or learning prompt engineering.

## Features

- **Telegram-first**: Start with Telegram, expand to Slack, Teams, Discord, and more
- **Provider-agnostic**: Works with OpenAI, OpenRouter, Ollama, and more
- **Self-hostable**: Run on your own infrastructure
- **Open-source**: MIT licensed, community-driven

## Quick Start

```bash
# Install globally
npm install -g @talocode/worklane

# Initialize
worklane init

# Run a task
worklane run "summarize this discussion"

# List agents
worklane agents list
```

## Telegram Bot Setup

1. Create a bot with @BotFather
2. Get your bot token
3. Set environment variable: `export TELEGRAM_BOT_TOKEN=your_token`
4. Run: `worklane telegram`

## Agents

- **Manager**: Routes tasks to appropriate agents
- **Research**: Conducts research on topics
- **Writer**: Creates written content
- **Engineer**: Plans technical implementation
- **QA**: Reviews work for quality
- **Support**: Handles support requests
- **Marketing**: Creates marketing content

## Workflows

- **Summarize**: Summarize discussions and extract action items
- **Draft Reply**: Draft replies to messages
- **Launch Plan**: Create launch plans for products
- **Research**: Conduct research on topics
- **Create Issue**: Create GitHub issue drafts
- **Create Post**: Create social media posts
- **Video Brief**: Create video briefs for ClipLoop

## Configuration

WorkLane uses a TOML config file at `~/.worklane/config.toml`:

```toml
model = "gpt-4"
provider = "openai"

[providers.openai]
base_url = "https://api.openai.com/v1"
env_key = "OPENAI_API_KEY"

[providers.openrouter]
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"

[providers.ollama]
base_url = "http://localhost:11434/v1"
```

## Architecture

```
worklane/
├── apps/
│   ├── telegram-bot/    # Telegram bot interface
│   └── api-server/      # HTTP webhook server
├── packages/
│   ├── core/            # Core routing and types
│   ├── agents/          # Agent definitions
│   ├── memory/          # Local memory storage
│   ├── providers/       # Provider-agnostic model layer
│   ├── workflows/       # Workflow definitions
│   ├── connectors/      # Platform connectors
│   └── cli/             # CLI interface
└── docs/                # Documentation
```

## Security

- Never print API keys
- Never expose .env files
- No automatic external sends
- No destructive actions without approval
- Log what agents do
- Store runs locally

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Telegram Setup](docs/TELEGRAM_SETUP.md)
- [Providers](docs/PROVIDERS.md)
- [Agents](docs/AGENTS.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)

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
