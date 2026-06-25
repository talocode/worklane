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
  const approvalsRoutePaths = [
    'apps/dashboard/src/app/api/automation/approvals/route.ts',
    'apps/dashboard/src/app/api/automation/approvals/[id]/route.ts',
    'apps/dashboard/src/app/api/automation/approvals/[id]/approve/route.ts',
    'apps/dashboard/src/app/api/automation/approvals/[id]/reject/route.ts',
    'apps/dashboard/src/app/api/automation/approvals/[id]/handoff/route.ts',
  ].map((relativePath) => path.join(repoRoot, relativePath));

  const automation = await import('../packages/data/src/automation/index.ts');
  const { toolGatewayStorage } = await import('../packages/data/src/tool-gateway/storage.ts');

  const backups = {};
  for (const [key, filePath] of Object.entries(automation.automationStorage.paths)) {
    backups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  const toolBackups = {};
  for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
    toolBackups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  try {
    console.log('\n1. Pending approval list returns JSON-like route files');
    assert(approvalsRoutePaths.every((filePath) => fs.existsSync(filePath)), 'Approval route files exist');
    const routeContents = approvalsRoutePaths.map((filePath) => fs.readFileSync(filePath, 'utf-8'));
    assert(routeContents.every((content) => content.includes('ok(') || content.includes('badRequest(') || content.includes('notFound(')), 'Approval route files use JSON helpers');

    console.log('\n2. Create routine run then appears in approvals');
    const routine = automation.createRoutine({
      name: 'Approval Routine',
      description: 'Create a pending approval run',
      task: 'Prepare a safe draft',
      toolGatewayToolIds: ['tool_worklane_run_create'],
    });
    const routineRun = automation.runRoutineNow(routine);
    const pendingRuns = automation.listPendingAutomationRuns();
    assert(pendingRuns.some((run) => run.id === routineRun.id), 'Routine run appears in approvals');

    console.log('\n3. Approve automation run');
    const approvedRun = automation.approveAutomationRun(routineRun.id, 'reviewer');
    assert(approvedRun.approvalStatus === 'approved', 'Approve automation run works');
    assert(Boolean(approvedRun.approvedAt), 'approvedAt recorded');

    console.log('\n4. Reject automation run');
    const secondRoutine = automation.createRoutine({
      name: 'Rejected Routine',
      description: 'Will be rejected',
      task: 'Draft and reject',
      toolGatewayToolIds: ['tool_worklane_run_create'],
    });
    const rejectedSourceRun = automation.runRoutineNow(secondRoutine);
    const rejectedRun = automation.rejectAutomationRun(rejectedSourceRun.id, 'reviewer', 'Not ready');
    assert(rejectedRun.approvalStatus === 'rejected', 'Reject automation run works');
    assert(rejectedRun.rejectionReason === 'Not ready', 'Rejection reason recorded');

    console.log('\n5. Rejected run cannot be handed off');
    const rejectedHandoff = automation.handoffAutomationRun(rejectedRun.id);
    assert(Array.isArray(rejectedHandoff.errors) && rejectedHandoff.errors.length > 0, 'Rejected run handoff blocked');

    console.log('\n6. Approved run can request handoff');
    const approvedHandoff = automation.handoffAutomationRun(approvedRun.id);
    assert(Boolean(approvedHandoff.run), 'Approved run can request handoff');
    assert(['queued', 'handed_off', 'failed'].includes(approvedHandoff.run.handoffStatus), 'Handoff status recorded');

    console.log('\n7. Handoff respects Tool Gateway permissions');
    const draftRoutine = automation.createRoutine({
      name: 'Gateway Draft Routine',
      description: 'Uses write tool',
      task: 'Create a draft email',
      toolGatewayToolIds: ['tool_postlane_email_draft'],
    });
    const draftRun = automation.runRoutineNow(draftRoutine);
    automation.approveAutomationRun(draftRun.id, 'reviewer');
    const draftHandoff = automation.handoffAutomationRun(draftRun.id);
    assert(draftHandoff.run.report.toolCallIds.length >= 1, 'Handoff created Tool Gateway call');

    console.log('\n8. Handoff does not bypass destructive/external approval');
    const localSource = toolGatewayStorage.createSource({ name: 'Approval Local Source', type: 'local' });
    const destructiveTool = toolGatewayStorage.registerTool({
      sourceId: localSource.id,
      name: 'worklane.local.destructive.approval',
      displayName: 'Destructive Approval Tool',
      description: 'Destructive placeholder tool',
      inputSchema: { type: 'object' },
      riskLevel: 'destructive',
    });
    const destructiveRoutine = automation.createRoutine({
      name: 'Destructive Routine',
      description: 'Should stay safe',
      task: 'Queue destructive work safely',
      toolGatewayToolIds: [destructiveTool.id],
    });
    const destructiveRun = automation.runRoutineNow(destructiveRoutine);
    automation.approveAutomationRun(destructiveRun.id, 'reviewer');
    const destructiveHandoff = automation.handoffAutomationRun(destructiveRun.id);
    const handoffCallId = destructiveHandoff.run.report.toolCallIds[0];
    const storedToolCall = toolGatewayStorage.getCall(handoffCallId);
    assert(storedToolCall.status === 'pending_approval', 'Destructive handoff still requires Tool Gateway approval');

    console.log('\n9. Approval history is recorded');
    const history = automation.automationStorage.history.list();
    assert(history.some((entry) => entry.action === 'approved'), 'Approved history recorded');
    assert(history.some((entry) => entry.action === 'rejected'), 'Rejected history recorded');
    assert(history.some((entry) => entry.action === 'handoff_requested'), 'Handoff requested history recorded');

    console.log('\n10. No secrets in approval responses/storage');
    const approvalSummary = automation.getAutomationRunApprovalSummary(approvedRun);
    assert(!JSON.stringify(approvalSummary).includes('Bearer '), 'Approval summary does not expose secrets');
    const files = [...Object.values(automation.automationStorage.paths), ...Object.values(toolGatewayStorage.paths)].filter((filePath) => fs.existsSync(filePath));
    const noSecrets = files.every((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return !content.includes('ghp_') && !content.includes('sk-') && !content.includes('Bearer ');
    });
    assert(noSecrets, 'No secrets in storage files');

    console.log('\n11. Dashboard route exists');
    assert(fs.existsSync(path.join(repoRoot, 'apps/dashboard/src/app/dashboard/automation/page.tsx')), 'Automation dashboard route exists');

    console.log('\n12. Existing automation and Tool Gateway tests still exist');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-loops-routines-v010.mjs')), 'Existing automation test still present');
    assert(fs.existsSync(path.join(repoRoot, 'scripts/test-tool-gateway-v010.mjs')), 'Existing Tool Gateway test still present');

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    for (const [key, filePath] of Object.entries(automation.automationStorage.paths)) {
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
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
