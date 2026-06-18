import { generateId, createRequest, parseCommand, maskSecret } from '../utils';

describe('Utils', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should create request object', () => {
    const request = createRequest(
      'user-1',
      'summarize',
      ['this', 'text'],
      'cli'
    );

    expect(request.userId).toBe('user-1');
    expect(request.command).toBe('summarize');
    expect(request.args).toEqual(['this', 'text']);
    expect(request.source).toBe('cli');
    expect(request.id).toBeDefined();
    expect(request.timestamp).toBeInstanceOf(Date);
  });

  it('should parse command string', () => {
    const result = parseCommand('summarize this text');
    expect(result.command).toBe('summarize');
    expect(result.args).toEqual(['this', 'text']);
  });

  it('should parse empty command', () => {
    const result = parseCommand('');
    expect(result.command).toBe('');
    expect(result.args).toEqual([]);
  });

  it('should mask secrets', () => {
    expect(maskSecret('sk-1234567890')).toBe('sk-1****7890');
    expect(maskSecret('short')).toBe('****');
    expect(maskSecret('')).toBe('');
  });
});
