import type { ToolActionDefinition } from './types';

export const TOOL_REGISTRY: ToolActionDefinition[] = [
  {
    id: 'github.create_issue',
    provider: 'github',
    type: 'github.create_issue',
    name: 'Create GitHub Issue',
    description: 'Create a new issue in a GitHub repository',
    riskLevel: 'medium',
    requiresApproval: true,
    requiredConnectionType: 'github',
    inputSchema: {
      type: 'object',
      required: ['owner', 'repo', 'title'],
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body text' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
      },
    },
  },
  {
    id: 'github.create_comment',
    provider: 'github',
    type: 'github.create_comment',
    name: 'Comment on GitHub Issue',
    description: 'Add a comment to an existing GitHub issue',
    riskLevel: 'low',
    requiresApproval: true,
    requiredConnectionType: 'github',
    inputSchema: {
      type: 'object',
      required: ['owner', 'repo', 'issueNumber', 'body'],
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization' },
        repo: { type: 'string', description: 'Repository name' },
        issueNumber: { type: 'number', description: 'Issue number' },
        body: { type: 'string', description: 'Comment body text' },
      },
    },
  },
  {
    id: 'github.list_issues',
    provider: 'github',
    type: 'github.list_issues',
    name: 'List GitHub Issues',
    description: 'List issues in a GitHub repository',
    riskLevel: 'low',
    requiresApproval: false,
    requiredConnectionType: 'github',
    readOnly: true,
    inputSchema: {
      type: 'object',
      required: ['owner', 'repo'],
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state filter' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Label filter' },
        limit: { type: 'number', description: 'Max issues to return (1-50, default 20)' },
        includePullRequests: { type: 'boolean', description: 'Include pull requests (default: false)' },
      },
    },
  },
  {
    id: 'github.get_issue',
    provider: 'github',
    type: 'github.get_issue',
    name: 'Get GitHub Issue',
    description: 'Get details of a specific GitHub issue',
    riskLevel: 'low',
    requiresApproval: false,
    requiredConnectionType: 'github',
    readOnly: true,
    inputSchema: {
      type: 'object',
      required: ['owner', 'repo', 'issueNumber'],
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization' },
        repo: { type: 'string', description: 'Repository name' },
        issueNumber: { type: 'number', description: 'Issue number' },
      },
    },
  },
  {
    id: 'github.list_issue_comments',
    provider: 'github',
    type: 'github.list_issue_comments',
    name: 'List Issue Comments',
    description: 'List comments on a GitHub issue',
    riskLevel: 'low',
    requiresApproval: false,
    requiredConnectionType: 'github',
    readOnly: true,
    inputSchema: {
      type: 'object',
      required: ['owner', 'repo', 'issueNumber'],
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization' },
        repo: { type: 'string', description: 'Repository name' },
        issueNumber: { type: 'number', description: 'Issue number' },
        limit: { type: 'number', description: 'Max comments to return (1-50, default 20)' },
      },
    },
  },
  {
    id: 'github.search_issues',
    provider: 'github',
    type: 'github.search_issues',
    name: 'Search GitHub Issues',
    description: 'Search issues across GitHub repositories',
    riskLevel: 'low',
    requiresApproval: false,
    requiredConnectionType: 'github',
    readOnly: true,
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Search query text' },
        owner: { type: 'string', description: 'Filter by owner or organization' },
        repo: { type: 'string', description: 'Filter by repository (requires owner)' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state filter' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Label filter' },
        limit: { type: 'number', description: 'Max results to return (1-50, default 20)' },
        includePullRequests: { type: 'boolean', description: 'Include pull requests (default: false)' },
      },
    },
  },
];

export function getToolAction(actionType: string): ToolActionDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.type === actionType);
}

export function listToolActions(): ToolActionDefinition[] {
  return [...TOOL_REGISTRY];
}

export function isReadOnlyAction(actionType: string): boolean {
  const action = getToolAction(actionType);
  return action?.readOnly === true;
}
