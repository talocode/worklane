import type { ToolActionType, GitHubCreateIssueInput, GitHubCreateCommentInput, ToolExecutionResult, GitHubToolError } from './types';
import { createGitHubIssue, createGitHubComment } from './github';

export async function executeToolAction(
  actionType: ToolActionType,
  input: Record<string, unknown>
): Promise<{ ok: true; execution: ToolExecutionResult } | { ok: false; error: string; errorCode?: string }> {
  switch (actionType) {
    case 'github.create_issue': {
      const result = await createGitHubIssue(input as unknown as GitHubCreateIssueInput);
      if (!result.ok) {
        return { ok: false, error: result.error, errorCode: result.errorCode };
      }
      return {
        ok: true,
        execution: {
          mode: 'real',
          provider: 'github',
          action: 'github.create_issue',
          result: result.result as unknown as Record<string, unknown>,
        },
      };
    }
    case 'github.create_comment': {
      const result = await createGitHubComment(input as unknown as GitHubCreateCommentInput);
      if (!result.ok) {
        return { ok: false, error: result.error, errorCode: result.errorCode };
      }
      return {
        ok: true,
        execution: {
          mode: 'real',
          provider: 'github',
          action: 'github.create_comment',
          result: result.result as unknown as Record<string, unknown>,
        },
      };
    }
    default:
      return { ok: false, error: `Unknown action type: ${actionType}` };
  }
}
