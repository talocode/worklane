#!/usr/bin/env npx tsx

/**
 * Test script for WorkLane MVP.
 * Run: npx tsx scripts/test-worklane-mvp.mjs
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), '.worklane');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

function cleanup() {
  if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  }
}

console.log('\n=== WorkLane MVP Tests ===\n');

// Test 1: Import storage
console.log('1. Import Storage');
let storage;
try {
  const mod = await import('../packages/data/src/storage.ts');
  storage = mod.storage;
  assert(true, 'Storage module imported');
} catch (e) {
  assert(false, `Storage import failed: ${e.message}`);
}

// Test 2: Create agent
console.log('\n2. Create Agent');
const agent = storage.agents.create({
  workspaceId: 'ws_default',
  name: 'Test Agent',
  description: 'A test agent',
  skills: ['testing'],
  status: 'active',
});
assert(agent.id.startsWith('ag_'), 'Agent has ID');
assert(agent.name === 'Test Agent', 'Agent name preserved');
assert(agent.status === 'active', 'Agent status is active');
assert(agent.createdAt !== undefined, 'Agent has createdAt');

// Test 3: List agents
console.log('\n3. List Agents');
const agents = storage.agents.list();
assert(agents.length >= 1, 'At least 1 agent exists');
assert(agents[0].name === 'Test Agent', 'Listed agent matches created');

// Test 4: Create knowledge
console.log('\n4. Create Knowledge');
const doc = storage.knowledge.create({
  workspaceId: 'ws_default',
  title: 'Brand Guide',
  content: 'Our brand voice is professional.',
  tags: ['brand', 'voice'],
  category: 'guidelines',
  createdBy: 'user',
});
assert(doc.id.startsWith('kb_'), 'Knowledge has ID');
assert(doc.title === 'Brand Guide', 'Knowledge title preserved');

// Test 5: Create connection placeholder
console.log('\n5. Create Connection');
const conn = storage.connections.create({
  workspaceId: 'ws_default',
  name: 'GitHub',
  type: 'github',
  status: 'inactive',
  config: { repo: 'org/repo' },
  createdBy: 'user',
});
assert(conn.id.startsWith('conn_'), 'Connection has ID');
assert(conn.secretRef.startsWith('ref_'), 'Secret is a reference, not plaintext');
assert(!conn.secretRef.includes('token') && !conn.secretRef.includes('key'), 'Secret ref is not a real secret');

// Test 6: Create run
console.log('\n6. Create Run');
const run = storage.runs.create({
  workspaceId: 'ws_default',
  agentId: agent.id,
  task: 'Generate weekly report',
  status: 'pending_approval',
  executionMode: 'simulated',
  riskLevel: 'low',
  plan: [{ id: 'step_1', runId: '', order: 1, description: 'Analyze data', status: 'pending' }],
  approvalStatus: 'pending',
  createdBy: 'user',
});
assert(run.id.startsWith('run_'), 'Run has ID');
assert(run.status === 'pending_approval', 'Run requires approval');
assert(run.executionMode === 'simulated', 'Execution mode is simulated');

// Test 7: Run requires approval
console.log('\n7. Run Requires Approval');
assert(run.approvalStatus === 'pending', 'Approval status is pending');
assert(run.status === 'pending_approval', 'Run status is pending_approval');

// Test 8: Approve run
console.log('\n8. Approve Run');
const approval = storage.approvals.create({
  runId: run.id,
  workspaceId: 'ws_default',
  riskLevel: 'low',
  requiredPermissions: ['member'],
  status: 'pending',
  requestedBy: 'user',
});
assert(approval.id.startsWith('apr_'), 'Approval has ID');

storage.approvals.update(approval.id, { status: 'approved', reviewedBy: 'user' });
const updatedApproval = storage.approvals.get(approval.id);
assert(updatedApproval.status === 'approved', 'Approval updated to approved');

storage.runs.update(run.id, { status: 'running', approvalStatus: 'approved' });
const updatedRun = storage.runs.get(run.id);
assert(updatedRun.status === 'running', 'Run status updated to running');

// Test 9: Audit events created
console.log('\n9. Audit Events');
storage.audit.create({
  workspaceId: 'ws_default',
  actorId: 'user',
  actorType: 'user',
  action: 'agent.created',
  target: agent.id,
  targetType: 'agent',
  result: 'success',
});
const events = storage.audit.list();
assert(events.length >= 1, 'At least 1 audit event exists');
assert(events[0].action === 'agent.created', 'Audit event action preserved');
assert(events[0].timestamp !== undefined, 'Audit event has timestamp');

// Test 10: No plaintext secret stored
console.log('\n10. No Plaintext Secrets');
const connFiles = fs.readdirSync(DATA_DIR);
for (const f of connFiles) {
  if (f === 'connections.json') {
    const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
    const hasPlaintext = content.includes('ghp_') || content.includes('sk-') || content.includes('token:');
    assert(!hasPlaintext, 'No plaintext secrets in connections.json');
  }
}

// Test 11: Simulated execution clearly labelled
console.log('\n11. Simulated Execution');
assert(run.executionMode === 'simulated', 'Execution mode clearly labeled as simulated');

// Test 12: Docs don't mention external product names
console.log('\n12. No External Names in Public Files');
const filesToCheck = [
  'README.md',
  'docs/PRODUCT.md',
  'docs/ARCHITECTURE_COMMAND_CENTER.md',
  'docs/DATA_MODEL.md',
  'docs/API_COMMAND_CENTER.md',
];
let noExternal = true;
const forbiddenTerms = ['tasklet', 'shortwave', 'clone', 'inspired by'];
for (const file of filesToCheck) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
    for (const term of forbiddenTerms) {
      if (content.includes(term)) {
        noExternal = false;
        console.log(`  ✗ Forbidden term "${term}" found in ${file}`);
      }
    }
  }
}
assert(noExternal, 'No forbidden terms in public docs');

// Test 13: No overclaiming language
console.log('\n13. No Overclaiming Language');
let noOverclaim = true;
const overclaimTerms = ['guaranteed automation', 'hidden automation', 'agents that own the work', 'plaintext secret', 'fake integration'];
for (const file of filesToCheck) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
    for (const term of overclaimTerms) {
      if (content.includes(term)) {
        noOverclaim = false;
        console.log(`  ✗ Overclaim term "${term}" found in ${file}`);
      }
    }
  }
}
assert(noOverclaim, 'No overclaiming language in public docs');

// Test 14: Trigger creation
console.log('\n14. Trigger Creation');
const trigger = storage.triggers.create({
  workspaceId: 'ws_default',
  name: 'Weekly Report',
  type: 'schedule',
  agentId: agent.id,
  task: 'Generate weekly report',
  schedule: '0 8 * * 1',
  enabled: true,
});
assert(trigger.id.startsWith('trg_'), 'Trigger has ID');
assert(trigger.schedule === '0 8 * * 1', 'Schedule preserved');
assert(trigger.type === 'schedule', 'Trigger type is schedule');

// Cleanup
cleanup();

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
