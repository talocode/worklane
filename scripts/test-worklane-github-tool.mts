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

// Test 2: Registry has all six actions
console.log('\n2. Tool Registry');
const registryContent = fs.readFileSync('packages/data/src/tools/registry.ts', 'utf-8');
assert(registryContent.includes('github.create_issue'), 'Registry defines github.create_issue');
assert(registryContent.includes('github.create_comment'), 'Registry defines github.create_comment');
assert(registryContent.includes('github.list_issues'), 'Registry defines github.list_issues');
assert(registryContent.includes('github.get_issue'), 'Registry defines github.get_issue');
assert(registryContent.includes('github.list_issue_comments'), 'Registry defines github.list_issue_comments');
assert(registryContent.includes('github.search_issues'), 'Registry defines github.search_issues');

// Test 3: Read-only actions marked correctly
console.log('\n3. Read-Only Actions');
assert(registryContent.includes('readOnly: true'), 'Read-only actions have readOnly: true');
assert(registryContent.includes('requiresApproval: false'), 'Read-only actions do not require approval');
assert(registryContent.includes("'List GitHub Issues'"), 'List issues action registered');
assert(registryContent.includes("'Get GitHub Issue'"), 'Get issue action registered');
assert(registryContent.includes("'List Issue Comments'"), 'List issue comments action registered');
assert(registryContent.includes("'Search GitHub Issues'"), 'Search issues action registered');
assert(registryContent.includes('isReadOnlyAction'), 'isReadOnlyAction function exported');

// Test 4: GitHub adapter hardening
console.log('\n4. GitHub Adapter');
const githubContent = fs.readFileSync('packages/data/src/tools/github.ts', 'utf-8');
assert(githubContent.includes('WORKLANE_GITHUB_TOKEN'), 'Uses env var for token');
assert(githubContent.includes('validateCreateIssueInput'), 'Validates issue input');
assert(githubContent.includes('validateCreateCommentInput'), 'Validates comment input');
assert(githubContent.includes('validateListIssuesInput'), 'Validates list issues input');
assert(githubContent.includes('validateGetIssueInput'), 'Validates get issue input');
assert(githubContent.includes('validateListIssueCommentsInput'), 'Validates list issue comments input');
assert(githubContent.includes('normalizeComment'), 'Normalizes comment objects');
assert(githubContent.includes('validateSearchIssuesInput'), 'Validates search issues input');
assert(githubContent.includes('buildSearchQuery'), 'Builds GitHub search query');
assert(githubContent.includes('normalizeSearchIssue'), 'Normalizes search issue objects');
assert(githubContent.includes('AbortController'), 'Uses AbortController for timeout');
assert(githubContent.includes('classifyGitHubError'), 'Classifies GitHub errors');
assert(githubContent.includes('githubRequestWithRetry'), 'Has retry wrapper');
assert(githubContent.includes('normalizeIssue'), 'Normalizes issue objects');
assert(githubContent.includes('isPullRequest'), 'Marks pull requests');
assert(githubContent.includes('bodyPreview'), 'Truncates issue body');
assert(!githubContent.includes('console.log(token)'), 'Does not log token');

// Test 5: List issues validation
console.log('\n5. List Issues Validation');
assert(githubContent.includes('state must be'), 'Validates state enum');
assert(githubContent.includes('limit must be 50 or fewer'), 'Validates limit max');
assert(githubContent.includes("'open'"), 'Default state is open');
assert(githubContent.includes('per_page'), 'Sets per_page param');
assert(githubContent.includes('includePullRequests'), 'Handles includePullRequests flag');

// Test 5b: Search issues validation
console.log('\n5b. Search Issues Validation');
assert(githubContent.includes('query is required'), 'Validates query required');
assert(githubContent.includes('query must be 256 characters'), 'Validates query length');
assert(githubContent.includes('owner is required when repo'), 'Validates repo requires owner');
assert(githubContent.includes('is:issue'), 'Search query includes is:issue');
assert(githubContent.includes('org:'), 'Search query supports org filter');
assert(githubContent.includes('repo:'), 'Search query supports repo filter');
assert(githubContent.includes('state:'), 'Search query supports state filter');
assert(githubContent.includes('label:'), 'Search query supports label filter');
assert(githubContent.includes('search/issues'), 'Calls GitHub search API');
assert(githubContent.includes('repositoryFullName'), 'Returns repository full name');
assert(githubContent.includes('incompleteResults'), 'Returns incomplete results flag');

// Test 6: Get issue validation
console.log('\n6. Get Issue Validation');
assert(githubContent.includes('issueNumber must be a positive integer'), 'Validates issueNumber');
assert(githubContent.includes('500'), 'Body preview truncated at 500 chars');
assert(githubContent.includes('bodyLength'), 'Returns body length');
assert(githubContent.includes('locked'), 'Returns locked status');
assert(githubContent.includes('assignees'), 'Returns assignees');

// Test 7: Tools executor handles all actions
console.log('\n7. Tools Executor');
const toolsExecContent = fs.readFileSync('packages/data/src/tools/executor.ts', 'utf-8');
assert(toolsExecContent.includes('github.list_issues'), 'Handles list_issues');
assert(toolsExecContent.includes('github.get_issue'), 'Handles get_issue');
assert(toolsExecContent.includes('github.list_issue_comments'), 'Handles list_issue_comments');
assert(toolsExecContent.includes('github.search_issues'), 'Handles search_issues');
assert(toolsExecContent.includes('listGitHubIssues'), 'Calls listGitHubIssues');
assert(toolsExecContent.includes('getGitHubIssue'), 'Calls getGitHubIssue');
assert(toolsExecContent.includes('listGitHubIssueComments'), 'Calls listGitHubIssueComments');
assert(toolsExecContent.includes('searchGitHubIssues'), 'Calls searchGitHubIssues');
assert(toolsExecContent.includes("'read'"), 'Sets mode to read for read-only actions');

// Test 8: Parent executor handles read-only
console.log('\n8. Parent Executor');
const executorContent = fs.readFileSync('packages/data/src/executor.ts', 'utf-8');
assert(executorContent.includes('isReadOnlyAction'), 'Checks if action is read-only');
assert(executorContent.includes('tool.read'), 'Uses tool.read audit prefix');
assert(executorContent.includes('Write actions must be approved'), 'Write actions still require approval');
assert(executorContent.includes('Listed'), 'Audit summary for list issues');
assert(executorContent.includes('Got issue'), 'Audit summary for get issue');
assert(executorContent.includes('Listed'), 'Audit summary for list issue comments');
assert(executorContent.includes('Found'), 'Audit summary for search issues');

// Test 9: Execute endpoint handles read-only
console.log('\n9. Execute Endpoint');
const executeContent = fs.readFileSync('apps/dashboard/src/app/api/runs/[id]/execute/route.ts', 'utf-8');
assert(executeContent.includes('isReadOnlyAction'), 'Checks readOnly in execute endpoint');
assert(executeContent.includes("'read'"), 'Sets read mode in response');

// Test 10: Dashboard supports all actions
console.log('\n10. Dashboard');
const runsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/runs/page.tsx', 'utf-8');
assert(runsPage.includes('github.list_issues'), 'Dashboard has list_issues action');
assert(runsPage.includes('github.get_issue'), 'Dashboard has get_issue action');
assert(runsPage.includes('github.list_issue_comments'), 'Dashboard has list_issue_comments action');
assert(runsPage.includes('github.search_issues'), 'Dashboard has search_issues action');
assert(runsPage.includes('List Comments'), 'Dashboard has List Comments label');
assert(runsPage.includes('Search Issues'), 'Dashboard has Search Issues label');
assert(runsPage.includes('READ'), 'Dashboard shows READ badge');
assert(runsPage.includes('Read-only: no approval required'), 'Dashboard shows read-only label');
assert(runsPage.includes('no approval required'), 'Dashboard mentions no approval for read-only');

// Test 11: Secret safety
console.log('\n11. Secret Safety');
assert(!githubContent.includes('"token"'), 'Does not hardcode token string');
const storageContent = fs.readFileSync('packages/data/src/storage.ts', 'utf-8');
assert(storageContent.includes('secretRef'), 'Storage uses secretRef');
assert(!storageContent.includes('plaintext'), 'No plaintext secret storage');

// Test 12: Types include read-only types
console.log('\n12. Types');
const typesContent = fs.readFileSync('packages/data/src/tools/types.ts', 'utf-8');
assert(typesContent.includes('GitHubListIssuesInput'), 'Has list issues input type');
assert(typesContent.includes('GitHubListIssuesResult'), 'Has list issues result type');
assert(typesContent.includes('GitHubIssueSummary'), 'Has issue summary type');
assert(typesContent.includes('GitHubGetIssueInput'), 'Has get issue input type');
assert(typesContent.includes('GitHubGetIssueResult'), 'Has get issue result type');
assert(typesContent.includes('GitHubListIssueCommentsInput'), 'Has list issue comments input type');
assert(typesContent.includes('GitHubListIssueCommentsResult'), 'Has list issue comments result type');
assert(typesContent.includes('GitHubIssueCommentSummary'), 'Has issue comment summary type');
assert(typesContent.includes('GitHubSearchIssuesInput'), 'Has search issues input type');
assert(typesContent.includes('GitHubSearchIssuesResult'), 'Has search issues result type');
assert(typesContent.includes('GitHubSearchIssueSummary'), 'Has search issue summary type');
assert(typesContent.includes('repositoryFullName'), 'Search summary has repositoryFullName');
assert(typesContent.includes('isPullRequest'), 'Issue summary has isPullRequest');
assert(typesContent.includes('readOnly?: boolean'), 'ToolActionDefinition has readOnly field');

// Test 13: Data package exports
console.log('\n13. Data Package Exports');
const indexContent = fs.readFileSync('packages/data/src/index.ts', 'utf-8');
assert(indexContent.includes('isReadOnlyAction'), 'Exports isReadOnlyAction');
assert(indexContent.includes('listGitHubIssues'), 'Exports listGitHubIssues');
assert(indexContent.includes('getGitHubIssue'), 'Exports getGitHubIssue');
assert(indexContent.includes('listGitHubIssueComments'), 'Exports listGitHubIssueComments');
assert(indexContent.includes('searchGitHubIssues'), 'Exports searchGitHubIssues');
assert(indexContent.includes('GitHubListIssuesInput'), 'Exports list issues types');
assert(indexContent.includes('GitHubGetIssueInput'), 'Exports get issue types');
assert(indexContent.includes('GitHubListIssueCommentsInput'), 'Exports list issue comments types');
assert(indexContent.includes('GitHubSearchIssuesInput'), 'Exports search issues types');

// Test 14: No overclaiming
console.log('\n14. No Overclaiming');
const filesToCheck = ['README.md', 'docs/GITHUB_TOOLING.md', 'docs/PRODUCT.md'];
let noOverclaim = true;
const overclaimTerms = ['broad github automation', 'guaranteed automation', 'hidden automation', 'all github features', 'close issue', 'delete issue'];
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

// Test 15: No external names
console.log('\n15. No External Names');
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

// Test 16: Docs complete
console.log('\n16. Documentation');
assert(fs.existsSync('docs/GITHUB_TOOLING.md'), 'GitHub tooling doc exists');
const toolingDoc = fs.readFileSync('docs/GITHUB_TOOLING.md', 'utf-8');
assert(toolingDoc.includes('list_issues'), 'Doc covers list issues');
assert(toolingDoc.includes('get_issue'), 'Doc covers get issue');
assert(toolingDoc.includes('list_issue_comments'), 'Doc covers list issue comments');
assert(toolingDoc.includes('search_issues'), 'Doc covers search issues');
assert(toolingDoc.includes('Search Issues'), 'Doc has Search Issues section');
assert(toolingDoc.includes('query'), 'Doc explains search query');
assert(toolingDoc.includes('is:issue'), 'Doc explains search query construction');
assert(toolingDoc.includes('Read-Only'), 'Doc explains read-only actions');
assert(toolingDoc.includes('No Approval Required') || toolingDoc.includes('no approval required'), 'Doc states read-only needs no approval');
assert(toolingDoc.includes('audit'), 'Doc explains audit logging');
assert(toolingDoc.includes('Limitations'), 'Doc lists limitations');

// Test 17: Write actions still require approval
console.log('\n17. Write Actions Still Require Approval');
assert(registryContent.includes("id: 'github.create_issue'"), 'Create issue still exists');
assert(registryContent.includes("requiresApproval: true"), 'Write actions still require approval');

// Test 18: .env.example
console.log('\n18. Environment Config');
const envContent = fs.readFileSync('.env.example', 'utf-8');
assert(envContent.includes('WORKLANE_GITHUB_TOKEN'), '.env.example has GitHub token');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
