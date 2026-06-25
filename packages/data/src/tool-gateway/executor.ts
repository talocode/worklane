import { createToolGatewayAuditEvent } from './audit';
import { evaluateToolPermission } from './permissions';
import { listGatewaySources, getGatewayTool } from './registry';
import { sourceConfigSignal } from './sources';
import { toolGatewayStorage } from './storage';
import { runTalocodeTool } from './talocodeTools';
import type { ToolGatewayCall, ToolGatewaySource, ToolGatewayTool } from './types';

function getSourceAndTool(toolId: string): { source?: ToolGatewaySource; tool?: ToolGatewayTool } {
  const tool = getGatewayTool(toolId);
  const source = tool ? listGatewaySources().find((item) => item.id === tool.sourceId) : undefined;
  return { source, tool };
}

export function createGatewayCall(toolId: string, input: Record<string, unknown>): {
  call?: ToolGatewayCall;
  audit?: ReturnType<typeof createToolGatewayAuditEvent>;
  error?: string;
} {
  const { source, tool } = getSourceAndTool(toolId);
  const permission = evaluateToolPermission(source, tool);
  if (!permission.allowed || !source || !tool) {
    return { error: permission.reason || 'Tool call is not allowed.' };
  }

  const call = toolGatewayStorage.createCall({
    toolId: tool.id,
    sourceId: source.id,
    input,
    status: permission.approvalRequired ? 'pending_approval' : 'approved',
    approvalRequired: permission.approvalRequired,
  });

  return {
    call,
    audit: createToolGatewayAuditEvent('tool_gateway.call.created', call, source, tool, permission.approvalRequired ? 'pending' : 'success', {
      approvalRequired: permission.approvalRequired,
    }),
  };
}

export function runGatewayCall(callId: string): {
  call?: ToolGatewayCall;
  audit?: ReturnType<typeof createToolGatewayAuditEvent>;
  error?: string;
} {
  const call = toolGatewayStorage.getCall(callId);
  if (!call) return { error: 'Tool call not found.' };
  const { source, tool } = getSourceAndTool(call.toolId);
  const permission = evaluateToolPermission(source, tool);
  if (!permission.allowed || !source || !tool) {
    return { error: permission.reason || 'Tool call is not allowed.' };
  }
  if (call.approvalRequired && call.status !== 'approved') {
    return { error: 'Tool call must be approved before execution.' };
  }

  toolGatewayStorage.updateCallStatus(call.id, { status: 'running', error: undefined });

  if (source.type === 'talocode') {
    const result = runTalocodeTool(tool, call.input);
    const updated = toolGatewayStorage.updateCallStatus(call.id, { status: 'succeeded', result });
    return {
      call: updated || { ...call, status: 'succeeded', result },
      audit: createToolGatewayAuditEvent('tool_gateway.call.succeeded', updated || { ...call, status: 'succeeded', result }, source, tool, 'success'),
    };
  }

  const configSignal = sourceConfigSignal(source);
  const result = configSignal === 'configured'
    ? { ok: true, warning: 'Tool Gateway v0.1 connected source placeholder. Real execution is not implemented yet.' }
    : { ok: false, warning: 'Tool not connected yet.', config: 'missing', note: 'Set the configured environment variable name before enabling real connections later.' };
  const status = configSignal === 'configured' ? 'succeeded' : 'failed';
  const updated = toolGatewayStorage.updateCallStatus(call.id, { status, result, error: status === 'failed' ? 'Tool source is not connected yet.' : undefined });
  return {
    call: updated || { ...call, status, result },
    audit: createToolGatewayAuditEvent(`tool_gateway.call.${status}`, updated || { ...call, status, result }, source, tool, status === 'failed' ? 'failure' : 'success', { sourceType: source.type }),
  };
}
