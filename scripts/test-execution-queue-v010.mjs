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
  const execution = await import('../packages/data/src/execution/index.ts');
  const { toolGatewayStorage } = await import('../packages/data/src/tool-gateway/storage.ts');
  const { createGatewayCall } = await import('../packages/data/src/tool-gateway/executor.ts');
  const automation = await import('../packages/data/src/automation/index.ts');

  const routePaths = [
    'apps/dashboard/src/app/api/execution/health/route.ts',
    'apps/dashboard/src/app/api/execution/queue/route.ts',
    'apps/dashboard/src/app/api/execution/history/route.ts',
    'apps/dashboard/src/app/api/tool-gateway/calls/[id]/queue/route.ts',
  ].map((relativePath) => path.join(repoRoot, relativePath));

  const backups = {};
  for (const [key, filePath] of Object.entries(execution.executionStorage.paths)) {
    backups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const toolBackups = {};
  for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
    toolBackups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const autoBackups = {};
  for (const [key, filePath] of Object.entries(automation.automationStorage.paths)) {
    autoBackups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  try {
    console.log('\n1. Execution health returns JSON route file');
    assert(routePaths.every((filePath) => fs.existsSync(filePath)), 'Execution route files exist');
    const routeContents = routePaths.map((filePath) => fs.readFileSync(filePath, 'utf-8'));
    assert(routeContents.every((content) => content.includes('ok(') || content.includes('badRequest(') || content.includes('notFound(')), 'Execution routes use JSON helpers');

    console.log('\n2. Approved Tool Gateway call can be queued');
    const readCallResult = createGatewayCall('tool_stacklane_project_inspect', { projectId: 'proj_1' });
    const queuedRead = execution.queueApprovedToolCall(readCallResult.call.id);
    assert(queuedRead.item.status === 'ready', 'Approved Tool Gateway call can be queued');

    console.log('\n3. Unapproved Tool Gateway call cannot be queued');
    const writeCallResult = createGatewayCall('tool_postlane_email_draft', { subject: 'Draft subject' });
    const blockedQueue = execution.queueApprovedToolCall(writeCallResult.call.id);
    assert(typeof blockedQueue.error === 'string', 'Unapproved Tool Gateway call cannot be queued');

    console.log('\n4. Queue list and detail return data');
    const list = execution.listExecutionQueue();
    assert(list.length >= 1, 'Queue list returns items');
    const detail = execution.getExecutionQueueItem(queuedRead.item.id);
    assert(detail.id === queuedRead.item.id, 'Queue item detail returns item');

    console.log('\n5. Safe read/local placeholder tool can run');
    const runResult = execution.runExecutionQueueItem(queuedRead.item.id);
    assert(runResult.item.status === 'succeeded', 'Safe read placeholder tool can run');

    console.log('\n6. Destructive/external tool does not auto-run');
    const localSource = toolGatewayStorage.createSource({ name: 'Queue Local Source', type: 'local' });
    const destructiveTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.queue.destructive',
      displayName: 'Queue Destructive Tool',
      description: 'Should not auto-run',
      inputSchema: { type: 'object' },
      riskLevel: 'destructive',
    });
    const destructiveCall = createGatewayCall(destructiveTool.id, {});
    toolGatewayStorage.approveCall(destructiveCall.call.id);
    const destructiveQueue = execution.queueApprovedToolCall(destructiveCall.call.id);
    assert(destructiveQueue.item.status === 'manual_required', 'Destructive tool does not auto-run');

    const externalTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.queue.external',
      displayName: 'Queue External Tool',
      description: 'Should remain manual',
      inputSchema: { type: 'object' },
      riskLevel: 'external',
    });
    const externalCall = createGatewayCall(externalTool.id, {});
    toolGatewayStorage.approveCall(externalCall.call.id);
    const externalQueue = execution.queueApprovedToolCall(externalCall.call.id);
    assert(externalQueue.item.status === 'manual_required', 'External tool does not auto-run');

    console.log('\n7. Unsupported tool becomes manual_required');
    const unsupportedTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.queue.unsupported',
      displayName: 'Unsupported Queue Tool',
      description: 'Read tool without supported executor',
      inputSchema: { type: 'object' },
      riskLevel: 'read',
    });
    const unsupportedCall = createGatewayCall(unsupportedTool.id, {});
    const unsupportedQueue = execution.queueApprovedToolCall(unsupportedCall.call.id);
    assert(unsupportedQueue.item.status === 'manual_required', 'Unsupported tool becomes manual_required');

    console.log('\n8. Disabled source and disabled tool block execution');
    const disabledSource = toolGatewayStorage.createSource({ name: 'Disabled Queue Source', type: 'local', enabled: false });
    const disabledSourceTool = toolGatewayStorage.registerTool({
      sourceId: disabledSource.id,
      name: 'worklane.local.queue.disabled-source',
      displayName: 'Disabled Source Queue Tool',
      description: 'Blocked by source',
      inputSchema: { type: 'object' },
      riskLevel: 'read',
    });
    const disabledSourceCall = createGatewayCall(disabledSourceTool.id, {});
    assert(typeof disabledSourceCall.error === 'string', 'Disabled source blocks execution');

    const disabledTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.queue.disabled-tool',
      displayName: 'Disabled Tool Queue Tool',
      description: 'Blocked by tool',
      inputSchema: { type: 'object' },
      riskLevel: 'read',
      enabled: false,
    });
    const disabledToolCall = createGatewayCall(disabledTool.id, {});
    assert(typeof disabledToolCall.error === 'string', 'Disabled tool blocks execution');

    console.log('\n9. Manual and cancel endpoints map to queue behavior');
    const manualUpdated = execution.markExecutionQueueItemManual(unsupportedQueue.item.id, 'Needs human workflow');
    assert(manualUpdated.status === 'manual_required', 'Manual endpoint marks manual_required');
    const cancellableCall = createGatewayCall('tool_stacklane_project_inspect', { projectId: 'proj_2' });
    const cancellableItem = execution.queueApprovedToolCall(cancellableCall.call.id).item;
    const cancelled = execution.cancelExecutionQueueItem(cancellableItem.id);
    assert(cancelled.status === 'cancelled', 'Cancel endpoint behavior works');

    console.log('\n10. Execution history recorded');
    const history = execution.executionStorage.history.list();
    assert(history.length >= 3, 'Execution history recorded');

    console.log('\n11. No secrets in storage or API-facing summaries');
    const summary = execution.getExecutionSummary(queuedRead.item);
    assert(!JSON.stringify(summary).includes('Bearer '), 'No secrets in execution summary');
    const files = [...Object.values(execution.executionStorage.paths), ...Object.values(toolGatewayStorage.paths)].filter((filePath) => fs.existsSync(filePath));
    const noSecrets = files.every((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return !content.includes('ghp_') && !content.includes('sk-') && !content.includes('Bearer ');
    });
    assert(noSecrets, 'No secrets in storage');

    console.log('\n12. Dashboard route exists and automation handoff integrates');
    assert(fs.existsSync(path.join(repoRoot, 'apps/dashboard/src/app/dashboard/execution/page.tsx')), 'Dashboard route exists');
    const routine = automation.createRoutine({
      name: 'Execution Queue Routine',
      description: 'Queues approved handoff call',
      task: 'Prepare a read queue handoff',
      toolGatewayToolIds: ['tool_stacklane_project_inspect'],
    });
    const autoRun = automation.runRoutineNow(routine);
    automation.approveAutomationRun(autoRun.id, 'reviewer');
    const handoff = automation.handoffAutomationRun(autoRun.id);
    const handedOffItem = execution.listExecutionQueue().find((item) => item.automationRunId === autoRun.id);
    assert(Boolean(handoff.run), 'Automation handoff completed');
    assert(Boolean(handedOffItem), 'Automation handoff is visible in execution queue');

    console.log('\n13. Existing tests still present');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-tool-gateway-v010.mjs')), 'Tool Gateway test still present');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-loops-routines-v010.mjs')), 'Automation test still present');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-automation-approvals-v010.mjs')), 'Automation approval test still present');

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    for (const [key, filePath] of Object.entries(execution.executionStorage.paths)) {
      const backup = backups[key];
      if (backup === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, backup, 'utf-8');
      }
    }
    for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
      const backup = toolBackups[key];
      if (backup === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, backup, 'utf-8');
      }
    }
    for (const [key, filePath] of Object.entries(automation.automationStorage.paths)) {
      const backup = autoBackups[key];
      if (backup === null) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, backup, 'utf-8');
      }
    }
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
