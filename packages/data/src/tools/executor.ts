import type { ToolActionType, GitHubCreateIssueInput, GitHubCreateCommentInput, GitHubListIssuesInput, GitHubGetIssueInput, ToolExecutionResult } from './types';
import { createGitHubIssue, createGitHubComment, listGitHubIssues, getGitHubIssue } from './github';

export async function executeToolAction(
  actionType: ToolActionType,
  input: Record<string, unknown>
): Promise<{ ok: true; execution: ToolExecutionResult } | { ok: false; error: string; errorCode?: string }> {
  switch (actionType) {
    case 'github.create_issue': {
      const result = await createGitHubIssue(input as unknown as GitHubCreateIssueInput);
      if (!result.ok) return { ok: false, error: result.error, errorCode: result.errorCode };
      return {
        ok: true,
        execution: { mode: 'real', provider: 'github', action: 'github.create_issue', result: result.result as unknown as Record<string, unknown> },
      };
    }
    case 'github.create_comment': {
      const result = await createGitHubComment(input as unknown as GitHubCreateCommentInput);
      if (!result.ok) return { ok: false, error: result.error, errorCode: result.errorCode };
      return {
        ok: true,
        execution: { mode: 'real', provider: 'github', action: 'github.create_comment', result: result.result as unknown as Record<string, unknown> },
      };
    }
    case 'github.list_issues': {
      const result = await listGitHubIssues(input as unknown as GitHubListIssuesInput);
      if (!result.ok) return { ok: false, error: result.error, errorCode: result.errorCode };
      return {
        ok: true,
        execution: { mode: 'read', provider: 'github', action: 'github.list_issues', result: result.result as unknown as Record<string, unknown> },
      };
    }
    case 'github.get_issue': {
      const result = await getGitHubIssue(input as unknown as GitHubGetIssueInput);
      if (!result.ok) return { ok: false, error: result.error, errorCode: result.errorCode };
      return {
        ok: true,
        execution: { mode: 'read', provider: 'github', action: 'github.get_issue', result: result.result as unknown as Record<string, unknown> },
      };
    }
    default:
      return { ok: false, error: `Unknown action type: ${actionType}` };
  }
}
