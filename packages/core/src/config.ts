import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  model: string;
  provider: string;
  providers: Record<string, {
    baseUrl: string;
    envKey: string;
  }>;
}

export class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(os.homedir(), '.worklane');
    this.configPath = path.join(this.configDir, 'config.toml');
  }

  async loadConfig(): Promise<Config> {
    if (!fs.existsSync(this.configPath)) {
      return this.getDefaultConfig();
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');
    return this.parseToml(content);
  }

  async saveConfig(config: Config): Promise<void> {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    const content = this.stringifyToml(config);
    fs.writeFileSync(this.configPath, content, 'utf-8');
  }

  private getDefaultConfig(): Config {
    return {
      model: 'gpt-4',
      provider: 'openai',
      providers: {
        openai: {
          baseUrl: 'https://api.openai.com/v1',
          envKey: 'OPENAI_API_KEY',
        },
        openrouter: {
          baseUrl: 'https://openrouter.ai/api/v1',
          envKey: 'OPENROUTER_API_KEY',
        },
        ollama: {
          baseUrl: 'http://localhost:11434/v1',
          envKey: '',
        },
      },
    };
  }

  private parseToml(content: string): Config {
    const config: Config = {
      model: 'gpt-4',
      provider: 'openai',
      providers: {},
    };

    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('[')) {
        currentSection = trimmed.slice(1, -1);
        if (!config.providers[currentSection]) {
          config.providers[currentSection] = { baseUrl: '', envKey: '' };
        }
        continue;
      }

      const [key, value] = trimmed.split('=').map(s => s.trim());
      const cleanValue = value?.replace(/^["']|["']$/g, '');

      if (currentSection) {
        if (key === 'base_url') {
          config.providers[currentSection].baseUrl = cleanValue || '';
        } else if (key === 'env_key') {
          config.providers[currentSection].envKey = cleanValue || '';
        }
      } else {
        if (key === 'model') {
          config.model = cleanValue || 'gpt-4';
        } else if (key === 'provider') {
          config.provider = cleanValue || 'openai';
        }
      }
    }

    return config;
  }

  private stringifyToml(config: Config): string {
    let content = `model = "${config.model}"\n`;
    content += `provider = "${config.provider}"\n\n`;

    for (const [name, provider] of Object.entries(config.providers)) {
      content += `[providers.${name}]\n`;
      content += `base_url = "${provider.baseUrl}"\n`;
      content += `env_key = "${provider.envKey}"\n\n`;
    }

    return content;
  }

  getConfigDir(): string {
    return this.configDir;
  }
}
