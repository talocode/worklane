import { normalizeSourceToTools } from './normalize';
import { toolGatewayStorage } from './storage';
import type { ToolGatewaySource, ToolGatewayTool } from './types';

export function listGatewaySources(): ToolGatewaySource[] {
  return toolGatewayStorage.listSources();
}

export function listGatewayTools(): ToolGatewayTool[] {
  toolGatewayStorage.ensureDefaults();
  const stored = toolGatewayStorage.listTools();
  const normalized = toolGatewayStorage.listSources().flatMap((source) => normalizeSourceToTools(source));
  const merged = new Map<string, ToolGatewayTool>();
  for (const tool of [...normalized, ...stored]) {
    merged.set(tool.id, tool);
  }
  return Array.from(merged.values());
}

export function getGatewayTool(id: string): ToolGatewayTool | undefined {
  return listGatewayTools().find((tool) => tool.id === id);
}
