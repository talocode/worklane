export type ToolProvider = 'github';

export type ToolActionType = 'github.create_issue' | 'github.create_comment';

export interface ToolActionDefinition {
  id: string;
  provider: ToolProvider;
  type: ToolActionType;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: true;
  requiredConnectionType: 'github';
  inputSchema: Record<string, unknown>;
}

export interface GitHubCreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
}

export interface GitHubCreateIssueResult {
  issueNumber: number;
  title: string;
  url: string;
  id: number;
}

export interface GitHubCreateCommentInput {
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}

export interface GitHubCreateCommentResult {
  commentId: number;
  commentUrl: string;
  issueNumber: number;
  createdAt: string | null;
}

export interface ToolExecutionResult {
  mode: 'real';
  provider: string;
  action: string;
  result: Record<string, unknown>;
}

export type GitHubErrorCode =
  | 'missing_token'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'rate_limited'
  | 'network_error'
  | 'timeout'
  | 'unknown';

export interface GitHubToolError {
  code: GitHubErrorCode;
  message: string;
  retryAfterSeconds?: number;
  status?: number;
}
