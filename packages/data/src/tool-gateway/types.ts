export type ToolSourceType = 'local' | 'http' | 'openapi' | 'mcp' | 'talocode';

export type ToolRiskLevel = 'read' | 'write' | 'destructive' | 'external';

export interface ToolGatewaySource {
  id: string;
  name: string;
  type: ToolSourceType;
  enabled: boolean;
  baseUrl?: string;
  description?: string;
  auth?: {
    type: 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth_placeholder';
    envKeyName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ToolGatewayTool {
  id: string;
  sourceId: string;
  name: string;
  displayName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolGatewayCall {
  id: string;
  toolId: string;
  sourceId: string;
  input: Record<string, unknown>;
  status: 'pending_approval' | 'approved' | 'running' | 'succeeded' | 'failed' | 'rejected';
  approvalRequired: boolean;
  approvedAt?: string;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolPermissionResult {
  allowed: boolean;
  approvalRequired: boolean;
  reason?: string;
}

export interface ToolDefinitionInput {
  sourceId: string;
  name: string;
  displayName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  riskLevel: ToolRiskLevel;
  requiresApproval?: boolean;
  enabled?: boolean;
  tags?: string[];
}

export interface ToolSourceInput {
  name: string;
  type: ToolSourceType;
  enabled?: boolean;
  baseUrl?: string;
  description?: string;
  auth?: ToolGatewaySource['auth'];
}
