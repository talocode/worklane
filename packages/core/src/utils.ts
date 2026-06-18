import * as crypto from 'crypto';
import { Request } from './types.js';

export function generateId(): string {
  return crypto.randomUUID();
}

export function createRequest(
  userId: string,
  command: string,
  args: string[],
  source: Request['source'],
  sourceId?: string,
  context?: Record<string, unknown>
): Request {
  return {
    id: generateId(),
    userId,
    command,
    args,
    context,
    timestamp: new Date(),
    source,
    sourceId,
  };
}

export function parseCommand(input: string): { command: string; args: string[] } {
  const parts = input.trim().split(/\s+/);
  const command = parts[0] || '';
  const args = parts.slice(1);
  return { command, args };
}

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '****';
  return value.slice(0, 4) + '****' + value.slice(-4);
}
