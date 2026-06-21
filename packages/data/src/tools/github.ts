import type { GitHubCreateIssueInput, GitHubCreateIssueResult } from './types';

const GITHUB_API_BASE = 'https://api.github.com';

function getGithubToken(): string | null {
  const token = process.env.WORKLANE_GITHUB_TOKEN;
  if (!token) return null;
  return token;
}

function validateCreateIssueInput(input: Record<string, unknown>): string | null {
  if (!input.owner || typeof input.owner !== 'string') return 'owner is required and must be a string';
  if (!input.repo || typeof input.repo !== 'string') return 'repo is required and must be a string';
  if (!input.title || typeof input.title !== 'string') return 'title is required and must be a string';
  if (input.body && typeof input.body !== 'string') return 'body must be a string';
  if (input.labels && !Array.isArray(input.labels)) return 'labels must be an array of strings';
  return null;
}

export async function createGitHubIssue(
  input: GitHubCreateIssueInput
): Promise<{ ok: true; result: GitHubCreateIssueResult } | { ok: false; error: string }> {
  const token = getGithubToken();
  if (!token) {
    return { ok: false, error: 'WORKLANE_GITHUB_TOKEN environment variable is not set' };
  }

  const validationError = validateCreateIssueInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const url = `${GITHUB_API_BASE}/repos/${input.owner}/${input.repo}/issues`;

  const body: Record<string, unknown> = { title: input.title };
  if (input.body) body.body = input.body;
  if (input.labels && input.labels.length > 0) body.labels = input.labels;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        ok: false,
        error: `GitHub API error (${response.status}): ${errorBody.slice(0, 200)}`,
      };
    }

    const data = await response.json();

    return {
      ok: true,
      result: {
        issueNumber: data.number,
        title: data.title,
        url: data.html_url,
        id: data.id,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Failed to create issue: ${message}` };
  }
}
