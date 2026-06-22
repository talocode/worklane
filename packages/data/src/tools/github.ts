import type {
  GitHubCreateIssueInput,
  GitHubCreateIssueResult,
  GitHubCreateCommentInput,
  GitHubCreateCommentResult,
  GitHubToolError,
  GitHubErrorCode,
} from './types';

const GITHUB_API_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 3000;

function getGithubToken(): string | null {
  const token = process.env.WORKLANE_GITHUB_TOKEN;
  if (!token) return null;
  return token;
}

function classifyGitHubError(status: number, headers: Headers, body: string): GitHubToolError {
  if (status === 401) {
    return { code: 'unauthorized', message: 'Invalid or expired GitHub token', status };
  }
  if (status === 403) {
    const rateLimitRemaining = headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0') {
      const resetEpoch = parseInt(headers.get('x-ratelimit-reset') || '0', 10);
      const retryAfter = Math.max(0, Math.ceil(resetEpoch - Date.now() / 1000));
      return {
        code: 'rate_limited',
        message: 'GitHub API rate limit exceeded',
        retryAfterSeconds: Math.min(retryAfter, 300),
        status,
      };
    }
    return { code: 'forbidden', message: 'Insufficient permissions for this GitHub action', status };
  }
  if (status === 404) {
    return { code: 'not_found', message: 'Repository or resource not found', status };
  }
  if (status === 422) {
    const detail = body.slice(0, 200);
    return { code: 'validation_error', message: `Validation error: ${detail}`, status };
  }
  if (status >= 500) {
    return { code: 'unknown', message: `GitHub server error (${status})`, status };
  }
  return { code: 'unknown', message: `GitHub API error (${status}): ${body.slice(0, 200)}`, status };
}

function isRetryable(error: GitHubToolError): boolean {
  return error.code === 'network_error' || error.code === 'timeout' || (error.status !== undefined && error.status >= 500);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function githubFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<{ response: Response; body: string } | { error: GitHubToolError }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    const body = await response.text();
    return { response, body };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { error: { code: 'timeout', message: `GitHub API request timed out after ${REQUEST_TIMEOUT_MS}ms` } };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { error: { code: 'network_error', message: `Network error: ${message}` } };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function githubRequestWithRetry(
  url: string,
  token: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<{ response: Response; body: string } | { error: GitHubToolError }> {
  let lastError: GitHubToolError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
      await delay(backoff);
    }

    const result = await githubFetch(url, token, options);

    if ('error' in result) {
      lastError = result.error;
      if (isRetryable(result.error) && attempt < retries) {
        continue;
      }
      return result;
    }

    if (!result.response.ok) {
      const errorResult = classifyGitHubError(result.response.status, result.response.headers, result.body);
      lastError = errorResult;
      if (isRetryable(errorResult) && attempt < retries) {
        continue;
      }
      return { error: errorResult };
    }

    return result;
  }

  return { error: lastError || { code: 'unknown', message: 'Max retries exceeded' } };
}

function validateCreateIssueInput(input: Record<string, unknown>): string | null {
  if (!input.owner || typeof input.owner !== 'string') return 'owner is required and must be a string';
  if (!input.repo || typeof input.repo !== 'string') return 'repo is required and must be a string';
  if (!input.title || typeof input.title !== 'string') return 'title is required and must be a string';
  if (input.body && typeof input.body !== 'string') return 'body must be a string';
  if (input.labels && !Array.isArray(input.labels)) return 'labels must be an array of strings';
  return null;
}

function validateCreateCommentInput(input: Record<string, unknown>): string | null {
  if (!input.owner || typeof input.owner !== 'string') return 'owner is required and must be a string';
  if (!input.repo || typeof input.repo !== 'string') return 'repo is required and must be a string';
  if (input.issueNumber === undefined || input.issueNumber === null) return 'issueNumber is required';
  if (typeof input.issueNumber !== 'number' || !Number.isInteger(input.issueNumber) || input.issueNumber <= 0) {
    return 'issueNumber must be a positive integer';
  }
  if (!input.body || typeof input.body !== 'string') return 'body is required and must be a string';
  if (input.body.length > 65536) return 'body must be 65536 characters or fewer';
  return null;
}

export async function createGitHubIssue(
  input: GitHubCreateIssueInput
): Promise<{ ok: true; result: GitHubCreateIssueResult } | { ok: false; error: string; errorCode?: GitHubErrorCode }> {
  const token = getGithubToken();
  if (!token) {
    return { ok: false, error: 'WORKLANE_GITHUB_TOKEN environment variable is not set', errorCode: 'missing_token' };
  }

  const validationError = validateCreateIssueInput(input);
  if (validationError) {
    return { ok: false, error: validationError, errorCode: 'validation_error' };
  }

  const url = `${GITHUB_API_BASE}/repos/${input.owner}/${input.repo}/issues`;
  const body: Record<string, unknown> = { title: input.title };
  if (input.body) body.body = input.body;
  if (input.labels && input.labels.length > 0) body.labels = input.labels;

  const result = await githubRequestWithRetry(url, token, { method: 'POST', body: JSON.stringify(body) });

  if ('error' in result) {
    return { ok: false, error: result.error.message, errorCode: result.error.code };
  }

  const data = JSON.parse(result.body);
  return {
    ok: true,
    result: {
      issueNumber: data.number,
      title: data.title,
      url: data.html_url,
      id: data.id,
    },
  };
}

export async function createGitHubComment(
  input: GitHubCreateCommentInput
): Promise<{ ok: true; result: GitHubCreateCommentResult } | { ok: false; error: string; errorCode?: GitHubErrorCode }> {
  const token = getGithubToken();
  if (!token) {
    return { ok: false, error: 'WORKLANE_GITHUB_TOKEN environment variable is not set', errorCode: 'missing_token' };
  }

  const validationError = validateCreateCommentInput(input);
  if (validationError) {
    return { ok: false, error: validationError, errorCode: 'validation_error' };
  }

  const url = `${GITHUB_API_BASE}/repos/${input.owner}/${input.repo}/issues/${input.issueNumber}/comments`;
  const body = { body: input.body };

  const result = await githubRequestWithRetry(url, token, { method: 'POST', body: JSON.stringify(body) });

  if ('error' in result) {
    return { ok: false, error: result.error.message, errorCode: result.error.code };
  }

  const data = JSON.parse(result.body);
  return {
    ok: true,
    result: {
      commentId: data.id,
      commentUrl: data.html_url,
      issueNumber: input.issueNumber,
      createdAt: data.created_at || null,
    },
  };
}
