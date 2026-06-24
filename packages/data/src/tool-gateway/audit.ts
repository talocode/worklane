import type { AuditEvent } from '../types';
import type { ToolGatewayCall, ToolGatewaySource, ToolGatewayTool } from './types';

export function createToolGatewayAuditEvent(
  action: string,
  call: ToolGatewayCall,
  source: ToolGatewaySource,
  tool: ToolGatewayTool,
  result: AuditEvent['result'],
  metadata?: Record<string, unknown>
): Omit<AuditEvent, 'id' | 'timestamp'> {
  return {
    workspaceId: 'ws_default',
    actorId: 'user',
    actorType: 'user',
    action,
    target: call.id,
    targetType: 'tool_gateway_call',
    result,
    metadata: {
      toolId: tool.id,
      toolName: tool.name,
      sourceId: source.id,
      sourceType: source.type,
      ...metadata,
    },
  };
}
