# Providers

WorkLane supports multiple AI providers through a provider-agnostic interface.

## Supported Providers

### OpenAI

- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Base URL**: `https://api.openai.com/v1`
- **API Key**: Set `OPENAI_API_KEY` environment variable

### OpenRouter

- **Models**: Multiple models from different providers
- **Base URL**: `https://openrouter.ai/api/v1`
- **API Key**: Set `OPENROUTER_API_KEY` environment variable

### Ollama (Local)

- **Models**: Llama 3, Mistral, CodeLlama
- **Base URL**: `http://localhost:11434/v1`
- **API Key**: Not required

## Configuration

Configure providers in `~/.worklane/config.toml`:

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

## Switching Providers

Change the active provider in config.toml:

```toml
provider = "openrouter"
model = "anthropic/claude-3-opus"
```

## Adding New Providers

To add a new provider, implement the `Provider` interface:

```typescript
interface Provider {
  name: string;
  models: string[];
  complete: (prompt: string, model?: string) => Promise<string>;
}
```

## Security

- API keys are stored in environment variables
- Keys are never logged or exposed
- Config file uses `env_key` to reference environment variables
