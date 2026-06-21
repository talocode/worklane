export type ToolProvider = 'github';

export type ToolActionType = 'github.create_issue';

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

export interface ToolExecutionResult {
  mode: 'real';
  provider: string;
  action: string;
  result: Record<string, unknown>;
}
