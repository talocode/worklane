#!/usr/bin/env node

/**
 * WorkLane GitHub tool tests.
 * Run: node scripts/test-worklane-github-tool.mts
 */

import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\n=== WorkLane GitHub Tool Tests ===\n');

// Test 1: Tool types exist
console.log('1. Tool Types');
assert(fs.existsSync('packages/data/src/tools/types.ts'), 'tools/types.ts exists');
assert(fs.existsSync('packages/data/src/tools/registry.ts'), 'tools/registry.ts exists');
assert(fs.existsSync('packages/data/src/tools/github.ts'), 'tools/github.ts exists');
assert(fs.existsSync('packages/data/src/tools/executor.ts'), 'tools/executor.ts exists');
assert(fs.existsSync('packages/data/src/tools/index.ts'), 'tools/index.ts exists');

// Test 2: Registry has both actions
console.log('\n2. Tool Registry');
const registryContent = fs.readFileSync('packages/data/src/tools/registry.ts', 'utf-8');
assert(registryContent.includes('github.create_issue'), 'Registry defines github.create_issue');
assert(registryContent.includes('github.create_comment'), 'Registry defines github.create_comment');
assert(registryContent.includes('requiresApproval: true'), 'Actions require approval');
assert(registryContent.includes("'low'"), 'Comment action has low risk');
assert(registryContent.includes("'medium'"), 'Issue action has medium risk');

// Test 3: GitHub adapter hardening
console.log('\n3. GitHub Adapter Hardening');
const githubContent = fs.readFileSync('packages/data/src/tools/github.ts', 'utf-8');
assert(githubContent.includes('WORKLANE_GITHUB_TOKEN'), 'Uses env var for token');
assert(githubContent.includes('validateCreateIssueInput'), 'Validates issue input');
assert(githubContent.includes('validateCreateCommentInput'), 'Validates comment input');
assert(githubContent.includes('api.github.com'), 'Calls GitHub API');
assert(githubContent.includes('AbortController'), 'Uses AbortController for timeout');
assert(githubContent.includes('REQUEST_TIMEOUT_MS'), 'Has timeout constant');
assert(githubContent.includes('MAX_RETRIES'), 'Has retry constant');
assert(githubContent.includes('BASE_DELAY_MS'), 'Has backoff delay');
assert(githubContent.includes('classifyGitHubError'), 'Classifies GitHub errors');
assert(githubContent.includes('isRetryable'), 'Checks retryable errors');
assert(githubContent.includes('githubRequestWithRetry'), 'Has retry wrapper');
assert(!githubContent.includes('console.log(token)'), 'Does not log token');

// Test 4: Error codes defined
console.log('\n4. Error Codes');
assert(githubContent.includes("'missing_token'"), 'Missing token error code');
assert(githubContent.includes("'unauthorized'"), 'Unauthorized error code');
assert(githubContent.includes("'forbidden'"), 'Forbidden error code');
assert(githubContent.includes("'not_found'"), 'Not found error code');
assert(githubContent.includes("'validation_error'"), 'Validation error code');
assert(githubContent.includes("'rate_limited'"), 'Rate limited error code');
assert(githubContent.includes("'network_error'"), 'Network error code');
assert(githubContent.includes("'timeout'"), 'Timeout error code');

// Test 5: create_comment validates input
console.log('\n5. Comment Validation');
assert(githubContent.includes('issueNumber must be a positive integer'), 'Validates issueNumber is positive integer');
assert(githubContent.includes('body is required'), 'Validates body is required');
assert(githubContent.includes('65536'), 'Has body length limit');

// Test 6: Retry logic
console.log('\n6. Retry Logic');
assert(githubContent.includes('isRetryable'), 'Has isRetryable function');
assert(githubContent.includes('error.code === \'network_error\''), 'Retries network errors');
assert(githubContent.includes('error.code === \'timeout\''), 'Retries timeouts');
assert(githubContent.includes('error.status >= 500'), 'Retries 5xx errors');
assert(githubContent.includes('Math.min(BASE_DELAY_MS'), 'Uses bounded backoff');

// Test 7: Connection stores only secretRef
console.log('\n7. Secret Safety');
assert(!githubContent.includes('"token"'), 'Does not hardcode token string in source');
const storageContent = fs.readFileSync('packages/data/src/storage.ts', 'utf-8');
assert(storageContent.includes('secretRef'), 'Storage uses secretRef');
assert(!storageContent.includes('plaintext'), 'No plaintext secret storage');

// Test 8: Execute endpoint exists
console.log('\n8. Execute Endpoint');
assert(fs.existsSync('apps/dashboard/src/app/api/runs/[id]/execute/route.ts'), 'Execute route exists');
const executeContent = fs.readFileSync('apps/dashboard/src/app/api/runs/[id]/execute/route.ts', 'utf-8');
assert(executeContent.includes('approvalStatus'), 'Checks approval status');
assert(executeContent.includes('checkAuth'), 'Requires auth');

// Test 9: Tools API endpoint exists
console.log('\n9. Tools API');
assert(fs.existsSync('apps/dashboard/src/app/api/tools/route.ts'), 'Tools route exists');
const toolsContent = fs.readFileSync('apps/dashboard/src/app/api/tools/route.ts', 'utf-8');
assert(toolsContent.includes('listToolActions'), 'Lists tool actions');

// Test 10: Dashboard has approval labels
console.log('\n10. Dashboard Safety Labels');
const runsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/runs/page.tsx', 'utf-8');
assert(runsPage.includes('approval required') || runsPage.includes('requires approval'), 'Runs page mentions approval requirement');
assert(runsPage.includes('REAL') || runsPage.includes('SIMULATED'), 'Shows execution mode badge');
assert(runsPage.includes('Execute'), 'Has execute button');
assert(runsPage.includes('Comment on Issue'), 'Has comment action option');
assert(runsPage.includes('approval and execution'), 'Comment mentions approval before posting');

const connectionsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/connections/page.tsx', 'utf-8');
assert(connectionsPage.includes('WORKLANE_GITHUB_TOKEN'), 'Connections page shows token status');

// Test 11: Executor supports both actions
console.log('\n11. Executor');
const executorContent = fs.readFileSync('packages/data/src/executor.ts', 'utf-8');
assert(executorContent.includes('executeToolRun'), 'Has executeToolRun function');
assert(executorContent.includes('safeAuditSummary'), 'Has safe audit summary');
assert(executorContent.includes('safeInputPreview'), 'Has safe input preview');
assert(executorContent.includes('bodyPreview'), 'Includes body preview in audit');
assert(executorContent.includes('bodyLength'), 'Includes body length in audit');
assert(executorContent.includes('tool.execution'), 'Logs tool execution audit events');

// Test 12: Tools executor handles both actions
console.log('\n12. Tools Executor');
const toolsExecContent = fs.readFileSync('packages/data/src/tools/executor.ts', 'utf-8');
assert(toolsExecContent.includes('github.create_comment'), 'Handles create_comment');
assert(toolsExecContent.includes('createGitHubComment'), 'Calls createGitHubComment');

// Test 13: Types include tool action fields
console.log('\n13. Types');
const typesContent = fs.readFileSync('packages/data/src/types.ts', 'utf-8');
assert(typesContent.includes('toolAction'), 'TaskRun has toolAction field');
assert(typesContent.includes('toolInput'), 'TaskRun has toolInput field');

const toolTypesContent = fs.readFileSync('packages/data/src/tools/types.ts', 'utf-8');
assert(toolTypesContent.includes('GitHubCreateCommentInput'), 'Has comment input type');
assert(toolTypesContent.includes('GitHubCreateCommentResult'), 'Has comment result type');
assert(toolTypesContent.includes('GitHubToolError'), 'Has error type');
assert(toolTypesContent.includes('GitHubErrorCode'), 'Has error code type');
assert(toolTypesContent.includes('issueNumber: number'), 'Comment input has issueNumber');

// Test 14: .env.example updated
console.log('\n14. Environment Config');
const envContent = fs.readFileSync('.env.example', 'utf-8');
assert(envContent.includes('WORKLANE_GITHUB_TOKEN'), '.env.example has GitHub token');

// Test 15: No overclaiming
console.log('\n15. No Overclaiming');
const filesToCheck = ['README.md', 'docs/GITHUB_TOOLING.md', 'docs/PRODUCT.md'];
let noOverclaim = true;
const overclaimTerms = ['broad github automation', 'guaranteed automation', 'hidden automation', 'all github features', 'close issue'];
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase();
    for (const term of overclaimTerms) {
      if (content.includes(term)) {
        noOverclaim = false;
        console.log(`  ✗ Overclaim "${term}" in ${file}`);
      }
    }
  }
}
assert(noOverclaim, 'No overclaiming language');

// Test 16: No external names
console.log('\n16. No External Names');
let noExternal = true;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase();
    if (content.includes('tasklet') || content.includes('shortwave') || content.includes('clone') || content.includes('inspired by')) {
      noExternal = false;
    }
  }
}
assert(noExternal, 'No external product names');

// Test 17: Data package exports
console.log('\n17. Data Package Exports');
const indexContent = fs.readFileSync('packages/data/src/index.ts', 'utf-8');
assert(indexContent.includes('executeToolRun'), 'Exports executeToolRun');
assert(indexContent.includes('TOOL_REGISTRY'), 'Exports TOOL_REGISTRY');
assert(indexContent.includes('createGitHubIssue'), 'Exports createGitHubIssue');
assert(indexContent.includes('createGitHubComment'), 'Exports createGitHubComment');
assert(indexContent.includes('executeToolAction'), 'Exports executeToolAction');

// Test 18: Docs exist and are complete
console.log('\n18. Documentation');
assert(fs.existsSync('docs/GITHUB_TOOLING.md'), 'GitHub tooling doc exists');
const toolingDoc = fs.readFileSync('docs/GITHUB_TOOLING.md', 'utf-8');
assert(toolingDoc.includes('WORKLANE_GITHUB_TOKEN'), 'Doc explains token config');
assert(toolingDoc.includes('approval'), 'Doc explains approval flow');
assert(toolingDoc.includes('audit'), 'Doc explains audit logging');
assert(toolingDoc.includes('Limitations'), 'Doc lists limitations');
assert(toolingDoc.includes('create_comment'), 'Doc covers comment action');
assert(toolingDoc.includes('rate_limited'), 'Doc covers rate limiting');
assert(toolingDoc.includes('retry'), 'Doc covers retry behavior');
assert(toolingDoc.includes('Retries'), 'Doc has retry section');
assert(toolingDoc.includes('Error Handling'), 'Doc has error handling section');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
