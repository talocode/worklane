import { createDefaultRegistry } from '../index';
import { Provider } from '@talocode/worklane-core';

const mockProvider: Provider = {
  name: 'mock',
  models: ['mock-model'],
  complete: jest.fn().mockResolvedValue('Mock response'),
};

describe('AgentRegistry', () => {
  it('should create default registry with all agents', () => {
    const registry = createDefaultRegistry(mockProvider);
    const agents = registry.list();

    expect(agents).toHaveLength(7);
    expect(registry.getNames()).toContain('manager');
    expect(registry.getNames()).toContain('research');
    expect(registry.getNames()).toContain('writer');
    expect(registry.getNames()).toContain('engineer');
    expect(registry.getNames()).toContain('qa');
    expect(registry.getNames()).toContain('support');
    expect(registry.getNames()).toContain('marketing');
  });

  it('should get agent by name', () => {
    const registry = createDefaultRegistry(mockProvider);
    const agent = registry.get('research');

    expect(agent).toBeDefined();
    expect(agent?.name).toBe('research');
  });

  it('should return undefined for unknown agent', () => {
    const registry = createDefaultRegistry(mockProvider);
    const agent = registry.get('unknown');

    expect(agent).toBeUndefined();
  });
});
