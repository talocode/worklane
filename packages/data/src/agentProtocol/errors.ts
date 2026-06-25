export interface AgentProtocolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const PROTOCOL_ERRORS = {
  ACTION_NOT_FOUND: { code: 'ACTION_NOT_FOUND', message: 'Action not found in protocol registry' },
  PERMISSION_DENIED: { code: 'PERMISSION_DENIED', message: 'Missing required permissions' },
  APPROVAL_REQUIRED: { code: 'APPROVAL_REQUIRED', message: 'Action requires approval before execution' },
  APPROVAL_REJECTED: { code: 'APPROVAL_REJECTED', message: 'Action approval was rejected' },
  INVALID_INPUT: { code: 'INVALID_INPUT', message: 'Action input does not match schema' },
  EXECUTION_FAILED: { code: 'EXECUTION_FAILED', message: 'Action execution failed' },
  CONTEXT_NOT_FOUND: { code: 'CONTEXT_NOT_FOUND', message: 'Context provider not found' },
  RUN_NOT_FOUND: { code: 'RUN_NOT_FOUND', message: 'Run not found' },
  RUN_TERMINAL: { code: 'RUN_TERMINAL', message: 'Run is in a terminal state' },
} as const;

export function protocolError(code: keyof typeof PROTOCOL_ERRORS, details?: Record<string, unknown>): AgentProtocolError {
  return { ...PROTOCOL_ERRORS[code], details };
}
