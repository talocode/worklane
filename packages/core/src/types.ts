export interface Request {
  id: string;
  userId: string;
  command: string;
  args: string[];
  context?: Record<string, unknown>;
  timestamp: Date;
  source: 'telegram' | 'cli' | 'api';
  sourceId?: string;
}

export interface Response {
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  name: string;
  description: string;
  capabilities: string[];
  execute: (request: Request) => Promise<Response>;
}

export interface Workflow {
  name: string;
  description: string;
  triggers: string[];
  execute: (request: Request) => Promise<Response>;
}

export interface Provider {
  name: string;
  models: string[];
  complete: (prompt: string, model?: string) => Promise<string>;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Run {
  id: string;
  requestId: string;
  agentName: string;
  input: Request;
  output?: Response;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}
