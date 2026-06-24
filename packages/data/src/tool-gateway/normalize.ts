import { getTalocodeTools } from './talocodeTools';
import type { ToolDefinitionInput, ToolGatewaySource, ToolGatewayTool } from './types';

export function normalizeSourceToTools(source: ToolGatewaySource): ToolGatewayTool[] {
  if (source.type === 'talocode') {
    return getTalocodeTools();
  }

  return [];
}

export function normalizeManualTool(input: ToolDefinitionInput): ToolDefinitionInput {
  return {
    ...input,
    requiresApproval: input.requiresApproval ?? input.riskLevel !== 'read',
    enabled: input.enabled ?? true,
    tags: input.tags || [],
  };
}
