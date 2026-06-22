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
];

export function getToolAction(actionType: string): ToolActionDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.type === actionType);
}

export function listToolActions(): ToolActionDefinition[] {
  return [...TOOL_REGISTRY];
}
