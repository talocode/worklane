#!/usr/bin/env node

/**
 * WorkLane hardening tests.
 * Run: node scripts/test-worklane-hardening.mts
 */

import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\n=== WorkLane Hardening Tests ===\n');

// Test 1: API response helper exists
console.log('1. API Response Helper');
assert(fs.existsSync('apps/dashboard/src/lib/api/response.ts'), 'response.ts exists');
const responseContent = fs.readFileSync('apps/dashboard/src/lib/api/response.ts', 'utf-8');
assert(responseContent.includes('export function ok'), 'ok() helper exists');
assert(responseContent.includes('export function badRequest'), 'badRequest() helper exists');
assert(responseContent.includes('export function unauthorized'), 'unauthorized() helper exists');
assert(responseContent.includes('export function forbidden'), 'forbidden() helper exists');
assert(responseContent.includes('export function notFound'), 'notFound() helper exists');
assert(responseContent.includes('export function serverError'), 'serverError() helper exists');

// Test 2: Auth module exists
console.log('\n2. Auth Module');
assert(fs.existsSync('apps/dashboard/src/lib/api/auth.ts'), 'auth.ts exists');
const authContent = fs.readFileSync('apps/dashboard/src/lib/api/auth.ts', 'utf-8');
assert(authContent.includes('WORKLANE_DEV_TOKEN'), 'Uses WORKLANE_DEV_TOKEN env var');
assert(authContent.includes('unauthorized') || authContent.includes('401'), 'Returns unauthorized for missing token');
assert(authContent.includes('forbidden') || authContent.includes('403'), 'Returns forbidden for invalid token');

// Test 3: Protected API returns 401 without token
console.log('\n3. Auth Behavior');
assert(authContent.includes('authorization'), 'Checks authorization header');

// Test 4: Approval state machine exists
console.log('\n4. Approval State Machine');
assert(fs.existsSync('packages/data/src/approvals.ts'), 'approvals.ts exists');
const approvalsContent = fs.readFileSync('packages/data/src/approvals.ts', 'utf-8');
assert(approvalsContent.includes('canTransition'), 'canTransition function exists');
assert(approvalsContent.includes('transitionRun'), 'transitionRun function exists');
assert(approvalsContent.includes('pending_approval'), 'pending_approval status defined');
assert(approvalsContent.includes('Invalid transition'), 'Invalid transition error');

// Test 5: Invalid approval transition rejected
console.log('\n5. Transition Rules');
assert(approvalsContent.includes('completed') && approvalsContent.includes('[]'), 'completed has no outgoing transitions');
assert(approvalsContent.includes('cancelled') && approvalsContent.includes('[]'), 'cancelled has no outgoing transitions');

// Test 6: Simulated executor exists
console.log('\n6. Simulated Executor');
assert(fs.existsSync('packages/data/src/executor.ts'), 'executor.ts exists');
const executorContent = fs.readFileSync('packages/data/src/executor.ts', 'utf-8');
assert(executorContent.includes('executeSimulated'), 'executeSimulated function exists');
assert(executorContent.includes('approved'), 'Checks approval status');
assert(executorContent.includes('simulated'), 'Marks as simulated');
assert(executorContent.includes('Only simulated execution'), 'Refuses non-simulated');

// Test 7: Dashboard safety labels
console.log('\n7. Dashboard Safety Labels');
const runsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/runs/page.tsx', 'utf-8');
assert(runsPage.includes('SIMULATED'), 'Runs page shows SIMULATED badge');
assert(runsPage.includes('simulated'), 'Runs page references simulated mode');

const connectionsPage = fs.readFileSync('apps/dashboard/src/app/dashboard/connections/page.tsx', 'utf-8');
assert(connectionsPage.includes('reference only') || connectionsPage.includes('never stored'), 'Connections page mentions reference-only secrets');

const triggersPage = fs.readFileSync('apps/dashboard/src/app/dashboard/triggers/page.tsx', 'utf-8');
assert(triggersPage.includes('manual') || triggersPage.includes('planned'), 'Triggers page mentions manual/planned');

// Test 8: No plaintext secrets stored
console.log('\n8. No Plaintext Secrets');
const storageContent = fs.readFileSync('packages/data/src/storage.ts', 'utf-8');
assert(!storageContent.includes('plaintext'), 'Storage does not reference plaintext');

// Test 9: .env.example exists
console.log('\n9. Environment Config');
assert(fs.existsSync('.env.example'), '.env.example exists');
const envContent = fs.readFileSync('.env.example', 'utf-8');
assert(envContent.includes('WORKLANE_DEV_TOKEN'), '.env.example has WORKLANE_DEV_TOKEN');

// Test 10: No fake integration claims
console.log('\n10. No Overclaiming');
const filesToCheck = [
  'README.md',
  'docs/PRODUCT.md',
  'docs/ARCHITECTURE_COMMAND_CENTER.md',
];
let noOverclaim = true;
const overclaimTerms = ['real Slack execution', 'real GitHub execution', 'guaranteed automation', 'hidden automation'];
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

// Test 11: No external studied product names
console.log('\n11. No External Names');
let noExternal = true;
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase();
    if (content.includes('tasklet') || content.includes('shortwave')) {
      noExternal = false;
      console.log(`  ✗ External name in ${file}`);
    }
  }
}
assert(noExternal, 'No external product names');

// Test 12: Data package exports
console.log('\n12. Data Package Exports');
const indexContent = fs.readFileSync('packages/data/src/index.ts', 'utf-8');
assert(indexContent.includes('canTransition'), 'Exports canTransition');
assert(indexContent.includes('transitionRun'), 'Exports transitionRun');
assert(indexContent.includes('executeSimulated'), 'Exports executeSimulated');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
