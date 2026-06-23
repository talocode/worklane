/**
 * Talocode Agent-Native Protocol — Type Definitions
 * 
 * A shared protocol for Talocode products so agents can safely inspect context,
 * propose actions, request approval, execute approved actions, and write audit logs.
 */

export type ProductName = 'worklane' | 'codra' | 'cliploop' | 'launchpix' | 'tera' | 'stacklane';

export type RiskLevel = 'read' | 'low' | 'medium' | 'high' | 'destructive';

export type RunLifecycle =
  | 'draft'
  | 'context_gathering'
  | 'planning'
  | 'pending_approval'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PrivacyLevel = 'public' | 'workspace' | 'private' | 'sensitive';

export interface AgentActionDefinition {
  id: string;
  product: ProductName;
  type: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  riskLevel: RiskLevel;
  readOnly: boolean;
  requiresApproval: boolean;
  requiredPermissions: string[];
}

export interface AgentContextProvider {
  id: string;
  product: ProductName;
  title: string;
  description: string;
  provides: string[];
  privacyLevel: PrivacyLevel;
}

export interface AgentRun {
  id: string;
  product: ProductName;
  actionId: string;
  lifecycle: RunLifecycle;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  approvalRequired: boolean;
  approvedBy?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAuditEvent {
  id: string;
  runId: string;
  product: ProductName;
  action: string;
  actor: string;
  result: 'success' | 'failure' | 'pending';
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ProtocolManifest {
  name: string;
  version: string;
  product: ProductName;
  actions: AgentActionDefinition[];
  contextProviders: AgentContextProvider[];
  permissions: string[];
  runLifecycle: RunLifecycle[];
}
