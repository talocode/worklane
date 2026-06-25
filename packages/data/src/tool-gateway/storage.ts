import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinitionInput, ToolGatewayCall, ToolGatewaySource, ToolGatewayTool, ToolSourceInput } from './types';
import { getTalocodeSource, getTalocodeTools } from './talocodeTools';

const DATA_DIR = path.join(process.cwd(), '.worklane', 'tool-gateway');
const SOURCES_FILE = path.join(DATA_DIR, 'sources.json');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
const CALLS_FILE = path.join(DATA_DIR, 'calls.json');

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

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function upsertDefaults(): void {
  const sources = readJson<ToolGatewaySource>(SOURCES_FILE);
  const tools = readJson<ToolGatewayTool>(TOOLS_FILE);

  if (!sources.some((source) => source.id === 'src_talocode')) {
    sources.push(getTalocodeSource());
    writeJson(SOURCES_FILE, sources);
  }

  const defaultTools = getTalocodeTools();
  const mergedTools = [...tools];
  for (const tool of defaultTools) {
    if (!mergedTools.some((existing) => existing.id === tool.id)) {
      mergedTools.push(tool);
    }
  }
  writeJson(TOOLS_FILE, mergedTools);
}

function sanitizeSourceInput(input: ToolSourceInput): ToolSourceInput {
  return {
    ...input,
    auth: input.auth ? { type: input.auth.type, envKeyName: input.auth.envKeyName } : undefined,
  };
}

export const toolGatewayStorage = {
  paths: {
    sources: SOURCES_FILE,
    tools: TOOLS_FILE,
    calls: CALLS_FILE,
  },
  ensureDefaults(): void {
    upsertDefaults();
  },
  createSource(input: ToolSourceInput): ToolGatewaySource {
    upsertDefaults();
    const sources = readJson<ToolGatewaySource>(SOURCES_FILE);
    const timestamp = new Date().toISOString();
    const source: ToolGatewaySource = {
      id: generateId('src'),
      name: input.name,
      type: input.type,
      enabled: input.enabled ?? true,
      baseUrl: input.baseUrl,
      description: input.description,
      auth: sanitizeSourceInput(input).auth,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    sources.push(source);
    writeJson(SOURCES_FILE, sources);
    return source;
  },
  listSources(): ToolGatewaySource[] {
    upsertDefaults();
    return readJson<ToolGatewaySource>(SOURCES_FILE);
  },
  getSource(id: string): ToolGatewaySource | undefined {
    return this.listSources().find((source) => source.id === id);
  },
  updateSource(id: string, patch: Partial<ToolGatewaySource>): ToolGatewaySource | null {
    upsertDefaults();
    const sources = readJson<ToolGatewaySource>(SOURCES_FILE);
    const index = sources.findIndex((source) => source.id === id);
    if (index === -1) return null;
    sources[index] = { ...sources[index], ...patch, updatedAt: new Date().toISOString() };
    writeJson(SOURCES_FILE, sources);
    return sources[index];
  },
  registerTool(input: ToolDefinitionInput): ToolGatewayTool {
    upsertDefaults();
    const tools = readJson<ToolGatewayTool>(TOOLS_FILE);
    const timestamp = new Date().toISOString();
    const tool: ToolGatewayTool = {
      id: generateId('tool'),
      sourceId: input.sourceId,
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      inputSchema: input.inputSchema,
      outputSchema: input.outputSchema,
      riskLevel: input.riskLevel,
      requiresApproval: input.requiresApproval ?? input.riskLevel !== 'read',
      enabled: input.enabled ?? true,
      tags: input.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    tools.push(tool);
    writeJson(TOOLS_FILE, tools);
    return tool;
  },
  listTools(): ToolGatewayTool[] {
    upsertDefaults();
    return readJson<ToolGatewayTool>(TOOLS_FILE);
  },
  getTool(id: string): ToolGatewayTool | undefined {
    return this.listTools().find((tool) => tool.id === id);
  },
  createCall(data: Omit<ToolGatewayCall, 'id' | 'createdAt' | 'updatedAt'>): ToolGatewayCall {
    upsertDefaults();
    const calls = readJson<ToolGatewayCall>(CALLS_FILE);
    const timestamp = new Date().toISOString();
    const call: ToolGatewayCall = { ...data, id: generateId('call'), createdAt: timestamp, updatedAt: timestamp };
    calls.push(call);
    writeJson(CALLS_FILE, calls);
    return call;
  },
  listCalls(): ToolGatewayCall[] {
    return readJson<ToolGatewayCall>(CALLS_FILE);
  },
  getCall(id: string): ToolGatewayCall | undefined {
    return this.listCalls().find((call) => call.id === id);
  },
  approveCall(id: string): ToolGatewayCall | null {
    const calls = readJson<ToolGatewayCall>(CALLS_FILE);
    const index = calls.findIndex((call) => call.id === id);
    if (index === -1) return null;
    calls[index] = { ...calls[index], status: 'approved', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    writeJson(CALLS_FILE, calls);
    return calls[index];
  },
  updateCallStatus(id: string, patch: Partial<ToolGatewayCall>): ToolGatewayCall | null {
    const calls = readJson<ToolGatewayCall>(CALLS_FILE);
    const index = calls.findIndex((call) => call.id === id);
    if (index === -1) return null;
    calls[index] = { ...calls[index], ...patch, updatedAt: new Date().toISOString() };
    writeJson(CALLS_FILE, calls);
    return calls[index];
  },
};
