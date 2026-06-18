import { Provider } from '@talocode/worklane-core';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
}

export class OpenAIProvider implements Provider {
  name = 'openai';
  models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, model?: string): Promise<string> {
    const selectedModel = model || 'gpt-4';
    
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }
}

export class OpenRouterProvider implements Provider {
  name = 'openrouter';
  models = ['openai/gpt-4', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct'];
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, model?: string): Promise<string> {
    const selectedModel = model || 'openai/gpt-4';
    
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://github.com/talocode/worklane',
        'X-Title': 'WorkLane',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }
}

export class OllamaProvider implements Provider {
  name = 'ollama';
  models = ['llama3', 'mistral', 'codellama'];
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async complete(prompt: string, model?: string): Promise<string> {
    const selectedModel = model || 'llama3';
    
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }
}

export class ProviderFactory {
  static create(name: string, config: ProviderConfig): Provider {
    switch (name.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'openrouter':
        return new OpenRouterProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
}
