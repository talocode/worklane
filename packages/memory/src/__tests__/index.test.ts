import { MemoryStore } from '../index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('MemoryStore', () => {
  let memoryStore: MemoryStore;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worklane-memory-test-'));
    memoryStore = new MemoryStore(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should store and retrieve entries', async () => {
    await memoryStore.store('key1', 'value1', 'user-1');
    const entry = await memoryStore.retrieve('key1');

    expect(entry).toBeDefined();
    expect(entry?.key).toBe('key1');
    expect(entry?.value).toBe('value1');
    expect(entry?.userId).toBe('user-1');
  });

  it('should list all entries', async () => {
    await memoryStore.store('key1', 'value1', 'user-1');
    await memoryStore.store('key2', 'value2', 'user-1');

    const entries = await memoryStore.list();
    expect(entries).toHaveLength(2);
  });

  it('should delete entries', async () => {
    await memoryStore.store('key1', 'value1', 'user-1');
    const deleted = await memoryStore.delete('key1');
    const entry = await memoryStore.retrieve('key1');

    expect(deleted).toBe(true);
    expect(entry).toBeUndefined();
  });

  it('should search entries', async () => {
    await memoryStore.store('project-deadline', 'Friday', 'user-1');
    await memoryStore.store('meeting-time', '10am', 'user-1');

    const results = await memoryStore.search('deadline');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('project-deadline');
  });

  it('should return undefined for non-existent entry', async () => {
    const entry = await memoryStore.retrieve('non-existent');
    expect(entry).toBeUndefined();
  });
});
