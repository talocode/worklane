# Architecture

WorkLane is designed as a modular, provider-agnostic AI coworker platform.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interfaces                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Telegram Bot  │     CLI         │     API Server          │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Core     │
                    │   Router    │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
   │  Agents   │   │  Workflows  │   │  Memory   │
   └─────┬─────┘   └──────┬──────┘   └─────┬─────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Providers  │
                    └─────────────┘
```

## Core Package

The core package provides:

- **Types**: Core type definitions (Request, Response, Agent, Workflow, Provider)
- **Router**: Routes requests to appropriate agents or workflows
- **Permissions**: Manages user permissions and sensitive actions
- **Formatter**: Formats responses for different output types
- **Config**: Manages TOML configuration files
- **Utils**: Utility functions for ID generation, command parsing, etc.

## Provider Package

Provider-agnostic model layer supporting:

- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **OpenRouter**: Multiple models from different providers
- **Ollama**: Local models (Llama 3, Mistral, CodeLlama)

## Agent Package

Initial agents:

- **Manager Agent**: Routes tasks to appropriate agents
- **Research Agent**: Conducts research on topics
- **Writer Agent**: Creates written content
- **Engineer Agent**: Plans technical implementation
- **QA Agent**: Reviews work for quality
- **Support Agent**: Handles support requests
- **Marketing Agent**: Creates marketing content

## Workflow Package

Initial workflows:

- **Summarize**: Summarizes discussions and extracts action items
- **Draft Reply**: Drafts replies to messages or emails
- **Launch Plan**: Creates launch plans for products
- **Research**: Conducts research on topics
- **Create Issue**: Creates GitHub issue drafts
- **Create Post**: Creates social media posts
- **Video Brief**: Creates video briefs for ClipLoop

## Memory Package

Local memory storage:

- **MemoryStore**: Stores and retrieves key-value pairs
- **RunStore**: Stores execution runs for auditing

## Connector Package

Platform connectors:

- **TelegramConnector**: Telegram bot interface
- **CLIConnector**: Command-line interface
- **WebhookConnector**: HTTP webhook server

## Data Flow

1. User sends message via Telegram, CLI, or API
2. Connector normalizes request
3. Router finds appropriate handler (agent or workflow)
4. Handler executes using provider
5. Response formatted and sent back

## Security

- API keys never logged or exposed
- Sensitive actions require admin approval
- All runs logged locally
- No automatic external sends without confirmation
