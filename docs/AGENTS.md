# Agents

WorkLane includes several AI agents for different tasks.

## Available Agents

### Manager Agent

- **Name**: `manager`
- **Description**: Routes tasks to appropriate agents and coordinates work
- **Capabilities**: manage, route, coordinate, assign

### Research Agent

- **Name**: `research`
- **Description**: Conducts research on topics and provides findings
- **Capabilities**: research, investigate, analyze, study

### Writer Agent

- **Name**: `writer`
- **Description**: Creates written content including replies, posts, and documents
- **Capabilities**: write, draft, compose, create

### Engineer Agent

- **Name**: `engineer`
- **Description**: Plans technical implementation and architecture
- **Capabilities**: plan, architect, design, implement

### QA Agent

- **Name**: `qa`
- **Description**: Reviews work for quality, completeness, and correctness
- **Capabilities**: review, test, validate, check

### Support Agent

- **Name**: `support`
- **Description**: Handles support requests and troubleshooting
- **Capabilities**: help, support, troubleshoot, fix

### Marketing Agent

- **Name**: `marketing`
- **Description**: Creates marketing content and strategies
- **Capabilities**: marketing, promote, launch, announce

## Usage

### CLI

```bash
# List all agents
worklane agents list

# Run a task (agent is auto-selected)
worklane run "research Firecrawl pricing"
```

### Telegram

```
/agents
/work summarize this discussion
```

## Creating Custom Agents

To create a custom agent, implement the `Agent` interface:

```typescript
interface Agent {
  name: string;
  description: string;
  capabilities: string[];
  execute: (request: Request) => Promise<Response>;
}
```

Then register it with the agent registry:

```typescript
const registry = createDefaultRegistry(provider);
registry.register(new MyCustomAgent(provider));
```
