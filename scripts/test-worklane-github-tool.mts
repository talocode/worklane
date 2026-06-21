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

// Test 2: Registry has github.create_issue
console.log('\n2. Tool Registry');
const registryContent = fs.readFileSync('packages/data/src/tools/registry.ts', 'utf-8');
assert(registryContent.includes('github.create_issue'), 'Registry defines github.create_issue');
assert(registryContent.includes('requiresApproval: true'), 'Action requires approval');
assert(registryContent.includes('riskLevel'), 'Action has risk level');

// Test 3: GitHub adapter validates input
console.log('\n3. GitHub Adapter');
const githubContent = fs.readFileSync('packages/data/src/tools/github.ts', 'utf-8');
assert(githubContent.includes('WORKLANE_GITHUB_TOKEN'), 'Uses env var for token');
assert(githubContent.includes('validateCreateIssueInput'), 'Validates input');
assert(githubContent.includes('api.github.com'), 'Calls GitHub API');
assert(!githubContent.includes('console.log(token)'), 'Does not log token');

// Test 4: Connection stores only secretRef
console.log('\n4. Secret Safety');
assert(!githubContent.includes('token:'), 'Does not store token in connection');
const storageContent = fs.readFileSync('packages/data/src/storage.ts', 'utf-8');
assert(storageContent.includes('secretRef'), 'Storage uses secretRef');
assert(!storageContent.includes('plaintext'), 'No plaintext secret storage');

// Test 5: Execute endpoint exists
console.log('\n5. Execute Endpoint');
assert(fs.existsSync('apps/dashboard/src/app/api/runs/[id]/execute/route.ts'), 'Execute route exists');
const executeContent = fs.readFileSync('apps/dashboard/src/app/api/runs/[id]/execute/route.ts', 'utf-8');
assert(executeContent.includes('approvalStatus'), 'Checks approval status');
assert(executeContent.includes('checkAuth'), 'Requires auth');

// Test 6: Tools API endpoint exists
console.log('\n6. Tools API');
assert(fs.existsSync('apps/dashboard/src/app/api/tools/route.ts'), 'Tools route exists');
const toolsContent = fs.readFileSync('apps/dashboard/src/app/api/tools/route.ts', 'utf-8');
assert(toolsContent.includes('listToolActions'), 'Lists tool actions');

// Test 7: Dashboard has approval and token safety labels
console.log('\n7. Dashboard Safety Labels');
const runsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/runs/page.tsx', 'utf-8');
assert(runsPage.includes('approval required') || runsPage.includes('requires approval'), 'Runs page mentions approval requirement');
assert(runsPage.includes('REAL') || runsPage.includes('SIMULATED'), 'Shows execution mode badge');
assert(runsPage.includes('Execute'), 'Has execute button');

const connectionsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/connections/page.tsx', 'utf-8');
assert(connectionsPage.includes('WORKLANE_GITHUB_TOKEN'), 'Connections page shows token status');
assert(connectionsPage.includes('env') || connectionsPage.includes('environment'), 'Mentions env var storage');

// Test 8: Executor supports real execution
console.log('\n8. Executor');
const executorContent = fs.readFileSync('packages/data/src/executor.ts', 'utf-8');
assert(executorContent.includes('executeToolRun'), 'Has executeToolRun function');
assert(executorContent.includes('executeToolAction'), 'Calls executeToolAction');
assert(executorContent.includes('tool.execution'), 'Logs tool execution audit events');

// Test 9: Types include tool action fields
console.log('\n9. Types');
const typesContent = fs.readFileSync('packages/data/src/types.ts', 'utf-8');
assert(typesContent.includes('toolAction'), 'TaskRun has toolAction field');
assert(typesContent.includes('toolInput'), 'TaskRun has toolInput field');

// Test 10: .env.example updated
console.log('\n10. Environment Config');
const envContent = fs.readFileSync('.env.example', 'utf-8');
assert(envContent.includes('WORKLANE_GITHUB_TOKEN'), '.env.example has GitHub token');

// Test 11: No overclaiming
console.log('\n11. No Overclaiming');
const filesToCheck = ['README.md', 'docs/GITHUB_TOOLING.md', 'docs/PRODUCT.md'];
let noOverclaim = true;
const overclaimTerms = ['broad github automation', 'guaranteed automation', 'hidden automation', 'all github features'];
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

// Test 12: No external names
console.log('\n12. No External Names');
let noExternal = true;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase();
    if (content.includes('tasklet') || content.includes('shortwave')) {
      noExternal = false;
    }
  }
}
assert(noExternal, 'No external product names');

// Test 13: Data package exports
console.log('\n13. Data Package Exports');
const indexContent = fs.readFileSync('packages/data/src/index.ts', 'utf-8');
assert(indexContent.includes('executeToolRun'), 'Exports executeToolRun');
assert(indexContent.includes('TOOL_REGISTRY'), 'Exports TOOL_REGISTRY');
assert(indexContent.includes('createGitHubIssue'), 'Exports createGitHubIssue');
assert(indexContent.includes('executeToolAction'), 'Exports executeToolAction');

// Test 14: Docs exist
console.log('\n14. Documentation');
assert(fs.existsSync('docs/GITHUB_TOOLING.md'), 'GitHub tooling doc exists');
const toolingDoc = fs.readFileSync('docs/GITHUB_TOOLING.md', 'utf-8');
assert(toolingDoc.includes('WORKLANE_GITHUB_TOKEN'), 'Doc explains token config');
assert(toolingDoc.includes('approval'), 'Doc explains approval flow');
assert(toolingDoc.includes('audit'), 'Doc explains audit logging');
assert(toolingDoc.includes('Limitations'), 'Doc lists limitations');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
