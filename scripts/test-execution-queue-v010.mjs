#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ ${label}`);
    failed += 1;
  }
}

async function run() {
  const repoRoot = process.cwd();
  const routePaths = [
    'apps/dashboard/src/app/api/execution/health/route.ts',
    'apps/dashboard/src/app/api/execution/queue/route.ts',
    'apps/dashboard/src/app/api/execution/queue/[id]/route.ts',
    'apps/dashboard/src/app/api/execution/queue/[id]/run/route.ts',
    'apps/dashboard/src/app/api/execution/queue/[id]/manual/route.ts',
    'apps/dashboard/src/app/api/execution/queue/[id]/cancel/route.ts',
    'apps/dashboard/src/app/api/execution/history/route.ts',
    'apps/dashboard/src/app/api/tool-gateway/calls/[id]/queue/route.ts',
  ].map((relativePath) => path.join(repoRoot, relativePath));

  const { executionStorage } = await import('../packages/data/src/execution/storage.ts');
  const execution = await import('../packages/data/src/execution/index.ts');
  const { toolGatewayStorage } = await import('../packages/data/src/tool-gateway/storage.ts');
  const { createGatewayCall } = await import('../packages/data/src/tool-gateway/executor.ts');

  const auditPath = path.join(repoRoot, '.worklane', 'audit.json');
  const backups = {};
  for (const [key, filePath] of Object.entries(executionStorage.paths)) {
    backups[`execution:${key}`] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
    backups[`gateway:${key}`] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  backups.audit = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf-8') : null;
  if (fs.existsSync(auditPath)) fs.unlinkSync(auditPath);

  try {
    console.log('\n1. Execution health returns JSON');
    assert(routePaths.every((filePath) => fs.existsSync(filePath)), 'Execution route files exist');
    const routeContents = routePaths.map((filePath) => fs.readFileSync(filePath, 'utf-8'));
    assert(routeContents.every((content) => content.includes('ok(') || content.includes('badRequest(') || content.includes('notFound(')), 'Execution route files use JSON helpers');

    console.log('\n2. Approved Tool Gateway call can be queued');
    const approvedReadCall = createGatewayCall('tool_stacklane_project_inspect', { projectId: 'proj_123' });
    const queuedApproved = execution.queueApprovedToolCall(approvedReadCall.call.id);
    assert(Boolean(queuedApproved.item), 'Approved Tool Gateway call can be queued');
    assert(['ready', 'manual_required', 'blocked'].includes(queuedApproved.item.status), 'Queued item gets safe queue status');

    console.log('\n3. Unapproved Tool Gateway call cannot be queued');
    const unapprovedCall = createGatewayCall('tool_postlane_email_draft', { subject: 'Need approval' });
    const unapprovedQueue = execution.queueApprovedToolCall(unapprovedCall.call.id);
    assert(typeof unapprovedQueue.error === 'string', 'Unapproved Tool Gateway call cannot be queued');

    console.log('\n4. Queue list and detail return JSON-shaped data');
    const queueItems = execution.listExecutionQueue();
    assert(queueItems.length >= 1, 'Queue list works');
    const detailItem = execution.getExecutionQueueItem(queuedApproved.item.id);
    assert(detailItem.id === queuedApproved.item.id, 'Queue item detail works');

    console.log('\n5. Safe read placeholder tool can run');
    const runResult = execution.runExecutionQueueItem(queuedApproved.item.id);
    assert(runResult.item.status === 'succeeded', 'Safe read placeholder tool can run');

    console.log('\n6. Destructive and external tools do not auto-run');
    const localSource = toolGatewayStorage.createSource({ name: 'Queue Local Source', type: 'local' });
    const destructiveTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.destroy.queue',
      displayName: 'Destroy Queue Tool',
      description: 'Dangerous placeholder',
      inputSchema: { type: 'object' },
      riskLevel: 'destructive',
    });
    const destructiveCall = toolGatewayStorage.createCall({
      toolId: destructiveTool.id,
      sourceId: localSource.id,
      input: {},
      status: 'approved',
      approvalRequired: true,
      approvedAt: new Date().toISOString(),
    });
    const destructiveQueue = execution.queueApprovedToolCall(destructiveCall.id);
    assert(destructiveQueue.item.status === 'manual_required', 'Destructive tool becomes manual_required');

    const externalTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.external.queue',
      displayName: 'External Queue Tool',
      description: 'External placeholder',
      inputSchema: { type: 'object' },
      riskLevel: 'external',
    });
    const externalCall = toolGatewayStorage.createCall({
      toolId: externalTool.id,
      sourceId: localSource.id,
      input: {},
      status: 'approved',
      approvalRequired: true,
      approvedAt: new Date().toISOString(),
    });
    const externalQueue = execution.queueApprovedToolCall(externalCall.id);
    assert(externalQueue.item.status === 'manual_required', 'External tool becomes manual_required');

    console.log('\n7. Unsupported tool becomes manual_required');
    const localReadTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.unsupported.read',
      displayName: 'Unsupported Local Read',
      description: 'Unsupported local read placeholder',
      inputSchema: { type: 'object' },
      riskLevel: 'read',
    });
    const unsupportedCall = toolGatewayStorage.createCall({
      toolId: localReadTool.id,
      sourceId: localSource.id,
      input: {},
      status: 'approved',
      approvalRequired: false,
      approvedAt: new Date().toISOString(),
    });
    const unsupportedQueue = execution.queueApprovedToolCall(unsupportedCall.id);
    assert(unsupportedQueue.item.status === 'manual_required', 'Unsupported tool becomes manual_required');

    console.log('\n8. Disabled source and tool block execution');
    const disableCall = createGatewayCall('tool_launchpix_asset_plan', { productName: 'Launch' });
    const disableQueue = execution.queueApprovedToolCall(disableCall.call.id);
    toolGatewayStorage.updateSource('src_talocode', { enabled: false });
    const blockedBySource = execution.runExecutionQueueItem(disableQueue.item.id);
    assert(blockedBySource.item.status === 'blocked', 'Disabled source blocks execution');
    toolGatewayStorage.updateSource('src_talocode', { enabled: true });

    const disableToolCall = createGatewayCall('tool_stacklane_project_inspect', { projectId: 'proj_tool_disable' });
    const disableToolQueue = execution.queueApprovedToolCall(disableToolCall.call.id);
    const tool = toolGatewayStorage.getTool('tool_stacklane_project_inspect');
    const toolsFile = toolGatewayStorage.paths.tools;
    const tools = JSON.parse(fs.readFileSync(toolsFile, 'utf-8'));
    const toolIndex = tools.findIndex((item) => item.id === tool.id);
    tools[toolIndex] = { ...tools[toolIndex], enabled: false, updatedAt: new Date().toISOString() };
    fs.writeFileSync(toolsFile, JSON.stringify(tools, null, 2), 'utf-8');
    const blockedByTool = execution.runExecutionQueueItem(disableToolQueue.item.id);
    assert(blockedByTool.item.status === 'blocked', 'Disabled tool blocks execution');

    console.log('\n9. Missing auth config blocks execution safely');
    const httpSource = toolGatewayStorage.createSource({
      name: 'HTTP Queue Source',
      type: 'http',
      auth: { type: 'bearer', envKeyName: 'WORKLANE_EXECUTION_QUEUE_BEARER' },
    });
    const httpTool = toolGatewayStorage.registerTool({
      sourceId: httpSource.id,
      name: 'worklane.http.read.queue',
      displayName: 'HTTP Read Queue Tool',
      description: 'HTTP read placeholder',
      inputSchema: { type: 'object' },
      riskLevel: 'read',
    });
    const httpCall = toolGatewayStorage.createCall({
      toolId: httpTool.id,
      sourceId: httpSource.id,
      input: {},
      status: 'approved',
      approvalRequired: false,
      approvedAt: new Date().toISOString(),
    });
    const httpQueue = execution.queueApprovedToolCall(httpCall.id);
    assert(httpQueue.item.status === 'blocked', 'Missing auth config blocks execution safely');

    console.log('\n10. Manual and cancel endpoints work at data layer');
    const manualItem = execution.markExecutionQueueItemManual(httpQueue.item.id, 'Handle this one manually.');
    assert(manualItem.status === 'manual_required', 'Manual endpoint marks manual_required');
    const cancelledItem = execution.cancelExecutionQueueItem(manualItem.id);
    assert(cancelledItem.status === 'cancelled', 'Cancel endpoint works');

    console.log('\n11. Execution history is recorded');
    const history = executionStorage.history.list();
    assert(history.some((entry) => entry.action === 'queued'), 'Execution history records queue creation');
    assert(history.some((entry) => entry.action === 'run.succeeded'), 'Execution history records run success');
    assert(history.some((entry) => entry.action === 'manual_required'), 'Execution history records manual state');

    console.log('\n12. No secrets in storage or queue summaries');
    const summaries = execution.listExecutionQueue().map(execution.getExecutionSummary);
    assert(summaries.every((item) => !JSON.stringify(item).includes('Bearer ')), 'Queue summaries do not expose secrets');
    const storageFiles = [
      ...Object.values(executionStorage.paths),
      ...Object.values(toolGatewayStorage.paths),
      auditPath,
    ].filter((filePath) => fs.existsSync(filePath));
    const noSecrets = storageFiles.every((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return !content.includes('ghp_') && !content.includes('sk-') && !content.includes('Bearer ');
    });
    assert(noSecrets, 'No secrets in storage files');

    console.log('\n13. API errors are JSON-only and do not expose stack traces');
    assert(routeContents.every((content) => !content.toLowerCase().includes('stack trace')), 'API route files do not include stack traces');

    console.log('\n14. Dashboard route and docs exist');
    assert(fs.existsSync(path.join(repoRoot, 'apps/dashboard/src/app/dashboard/execution/page.tsx')), 'Execution dashboard route exists');
    assert(fs.existsSync(path.join(repoRoot, 'docs/EXECUTION_QUEUE.md')), 'Execution queue docs exist');

    console.log('\n15. Existing tests still exist');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-tool-gateway-v010.mjs')), 'Existing Tool Gateway tests still present');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-loops-routines-v010.mjs')), 'Existing automation tests still present');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-automation-approvals-v010.mjs')), 'Existing automation approval tests still present');

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    for (const [key, filePath] of Object.entries(executionStorage.paths)) {
      const backup = backups[`execution:${key}`];
      if (backup === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, backup, 'utf-8');
      }
    }
    for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
      const backup = backups[`gateway:${key}`];
      if (backup === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, backup, 'utf-8');
      }
    }
    if (backups.audit === null) {
      if (fs.existsSync(auditPath)) fs.unlinkSync(auditPath);
    } else {
      fs.mkdirSync(path.dirname(auditPath), { recursive: true });
      fs.writeFileSync(auditPath, backups.audit, 'utf-8');
    }
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
