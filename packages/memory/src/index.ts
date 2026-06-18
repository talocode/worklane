import * as fs from 'fs';
import * as path from 'path';
import { MemoryEntry } from '@talocode/worklane-core';
import { generateId } from '@talocode/worklane-core';

export class MemoryStore {
  private memoryDir: string;

  constructor(workDir: string = '.worklane') {
    this.memoryDir = path.join(workDir, 'memory');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  async store(key: string, value: string, userId: string, metadata?: Record<string, unknown>): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: generateId(),
      key,
      value,
      userId,
      timestamp: new Date(),
      metadata,
    };

    const filePath = this.getFilePath(key);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');

    return entry;
  }

  async retrieve(key: string): Promise<MemoryEntry | undefined> {
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return undefined;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async list(): Promise<MemoryEntry[]> {
    if (!fs.existsSync(this.memoryDir)) {
      return [];
    }

    const files = fs.readdirSync(this.memoryDir);
    const entries: MemoryEntry[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.memoryDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        entries.push(JSON.parse(content));
      }
    }

    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }

  async search(query: string): Promise<MemoryEntry[]> {
    const entries = await this.list();
    const lowerQuery = query.toLowerCase();
    
    return entries.filter(entry => 
      entry.key.toLowerCase().includes(lowerQuery) ||
      entry.value.toLowerCase().includes(lowerQuery)
    );
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return path.join(this.memoryDir, `${safeKey}.json`);
  }
}

export class RunStore {
  private runsDir: string;

  constructor(workDir: string = '.worklane') {
    this.runsDir = path.join(workDir, 'runs');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.runsDir)) {
      fs.mkdirSync(this.runsDir, { recursive: true });
    }
  }

  async saveRun(run: { id: string; requestId: string; agentName: string; input: unknown; output?: unknown; startTime: Date; endTime?: Date; status: string }): Promise<void> {
    const filePath = path.join(this.runsDir, `${run.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(run, null, 2), 'utf-8');
  }

  async getRun(id: string): Promise<unknown | undefined> {
    const filePath = path.join(this.runsDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return undefined;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async listRuns(): Promise<unknown[]> {
    if (!fs.existsSync(this.runsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.runsDir);
    const runs: unknown[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.runsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        runs.push(JSON.parse(content));
      }
    }

    return runs;
  }
}
