export type ToolProvider = 'github';

export type ToolActionType =
  | 'github.create_issue'
  | 'github.create_comment'
  | 'github.list_issues'
  | 'github.get_issue';

export interface ToolActionDefinition {
  id: string;
  provider: ToolProvider;
  type: ToolActionType;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  requiredConnectionType: 'github';
  readOnly?: boolean;
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

export interface GitHubListIssuesInput {
  owner: string;
  repo: string;
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  limit?: number;
  includePullRequests?: boolean;
}

export interface GitHubIssueSummary {
  number: number;
  title: string;
  state: string;
  url: string;
  labels: string[];
  createdAt: string | null;
  updatedAt: string | null;
  authorLogin: string;
  commentCount: number;
  isPullRequest: boolean;
}

export interface GitHubListIssuesResult {
  issues: GitHubIssueSummary[];
  totalCount: number;
  truncated: boolean;
}

export interface GitHubGetIssueInput {
  owner: string;
  repo: string;
  issueNumber: number;
}

export interface GitHubGetIssueResult {
  number: number;
  title: string;
  bodyPreview: string;
  bodyLength: number;
  state: string;
  url: string;
  labels: string[];
  createdAt: string | null;
  updatedAt: string | null;
  authorLogin: string;
  commentCount: number;
  isPullRequest: boolean;
  locked: boolean;
  assignees: string[];
}

export interface ToolExecutionResult {
  mode: 'real' | 'read';
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
