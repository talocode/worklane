import { ProviderFactory } from '../index';

describe('ProviderFactory', () => {
  it('should create OpenAI provider', () => {
    const provider = ProviderFactory.create('openai', {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key',
    });

    expect(provider.name).toBe('openai');
    expect(provider.models).toContain('gpt-4');
  });

  it('should create OpenRouter provider', () => {
    const provider = ProviderFactory.create('openrouter', {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'test-key',
    });

    expect(provider.name).toBe('openrouter');
    expect(provider.models).toContain('openai/gpt-4');
  });

  it('should create Ollama provider', () => {
    const provider = ProviderFactory.create('ollama', {
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
    });

    expect(provider.name).toBe('ollama');
    expect(provider.models).toContain('llama3');
  });

  it('should throw for unknown provider', () => {
    expect(() => {
      ProviderFactory.create('unknown', {
        baseUrl: 'http://example.com',
        apiKey: 'test-key',
      });
    }).toThrow('Unknown provider');
  });
});
