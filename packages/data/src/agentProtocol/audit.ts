import type { AgentAuditEvent, ProductName } from './types';

export function createAuditEvent(params: {
  runId: string;
  product: ProductName;
  action: string;
  actor: string;
  result: 'success' | 'failure' | 'pending';
  metadata?: Record<string, unknown>;
}): Omit<AgentAuditEvent, 'id'> {
  return {
    runId: params.runId,
    product: params.product,
    action: params.action,
    actor: params.actor,
    result: params.result,
    metadata: params.metadata || {},
    createdAt: new Date().toISOString(),
  };
}

export function safeAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'authorization'];
  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      safe[key] = '***';
    } else {
      safe[key] = value;
    }
  }
  return safe;
}
