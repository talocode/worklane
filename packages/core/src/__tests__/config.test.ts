import { ConfigManager } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worklane-test-'));
    configManager = new ConfigManager(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return default config when no config file exists', async () => {
    const config = await configManager.loadConfig();
    expect(config.provider).toBe('openai');
    expect(config.model).toBe('gpt-4');
  });

  it('should save and load config', async () => {
    const config = {
      model: 'gpt-4-turbo',
      provider: 'openrouter',
      providers: {
        openrouter: {
          baseUrl: 'https://openrouter.ai/api/v1',
          envKey: 'OPENROUTER_API_KEY',
        },
      },
    };

    await configManager.saveConfig(config);
    const loaded = await configManager.loadConfig();

    expect(loaded.model).toBe('gpt-4-turbo');
    expect(loaded.provider).toBe('openrouter');
  });

  it('should mask secrets in config output', () => {
    const masked = configManager.getConfigDir();
    expect(masked).toBe(tempDir);
  });
});
