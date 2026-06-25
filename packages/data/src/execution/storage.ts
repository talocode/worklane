import * as fs from 'fs';
import * as path from 'path';
import type { ExecutionHistoryEntry, ExecutionQueueItem } from './types';

const DATA_DIR = path.join(process.cwd(), '.worklane', 'execution');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string): T[] {
  ensureDir();
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
}

function writeJson<T>(filePath: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const executionStorage = {
  paths: {
    queue: QUEUE_FILE,
    history: HISTORY_FILE,
  },
  queue: {
    list: () => readJson<ExecutionQueueItem>(QUEUE_FILE),
    get: (id: string) => readJson<ExecutionQueueItem>(QUEUE_FILE).find((item) => item.id === id),
    save: (item: ExecutionQueueItem) => {
      const items = readJson<ExecutionQueueItem>(QUEUE_FILE);
      const index = items.findIndex((existing) => existing.id === item.id);
      if (index === -1) items.push(item);
      else items[index] = item;
      writeJson(QUEUE_FILE, items);
      return item;
    },
    findByToolCallId: (toolCallId: string) => readJson<ExecutionQueueItem>(QUEUE_FILE).find((item) => item.toolCallId === toolCallId),
  },
  history: {
    list: () => readJson<ExecutionHistoryEntry>(HISTORY_FILE),
    append: (entry: ExecutionHistoryEntry) => {
      const items = readJson<ExecutionHistoryEntry>(HISTORY_FILE);
      items.push(entry);
      writeJson(HISTORY_FILE, items);
      return entry;
    },
  },
};
