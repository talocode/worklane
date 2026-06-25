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
    'apps/dashboard/src/app/api/automation/health/route.ts',
    'apps/dashboard/src/app/api/automation/loops/route.ts',
    'apps/dashboard/src/app/api/automation/routines/route.ts',
    'apps/dashboard/src/app/api/automation/runs/route.ts',
  ].map((relativePath) => path.join(repoRoot, relativePath));

  const automation = await import('../packages/data/src/automation/index.ts');

  const backups = {};
  for (const [key, filePath] of Object.entries(automation.automationStorage.paths)) {
    backups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  try {
    console.log('\n1. Automation health returns JSON');
    assert(routePaths.every((filePath) => fs.existsSync(filePath)), 'Automation route files exist');
    const healthContent = fs.readFileSync(routePaths[0], 'utf-8');
    assert(healthContent.includes('ok('), 'Automation health route returns JSON');

    console.log('\n2. Create loop and defaults');
    const loop = automation.createLoop({
      name: 'Morning Loop',
      task: 'Prepare a morning summary',
      intervalMinutes: 5,
      toolGatewayToolIds: ['tool_worklane_run_create'],
    });
    assert(loop.approvalRequired === true, 'Loop approvalRequired always true');
    assert(loop.permissionProfile === 'approval_required', 'Permission profile defaults to approval_required');
    assert(Boolean(loop.expiresAt), 'Default expiry applied');

    console.log('\n3. List loops and cancel loop');
    assert(automation.listLoops().some((item) => item.id === loop.id), 'List loops works');
    const cancelledLoop = automation.cancelLoop(loop.id);
    assert(cancelledLoop.status === 'cancelled', 'Cancel loop works');

    console.log('\n4. Minimum interval and max active loops');
    let minIntervalRejected = false;
    try {
      automation.createLoop({ name: 'Bad Loop', task: 'Too fast', intervalMinutes: 0 });
    } catch {
      minIntervalRejected = true;
    }
    assert(minIntervalRejected, 'Min interval is 1 minute');
    assert(automation.loopConstraints.MAX_ACTIVE_LOOPS === 50, 'Max active loops is 50');

    console.log('\n5. Create routine and list routines');
    const routine = automation.createRoutine({
      name: 'Weekly Promo Draft',
      description: 'Create a weekly promo draft',
      task: 'Prepare weekly promo planning',
      toolGatewayToolIds: ['tool_cliploop_director_plan'],
    });
    assert(routine.approvalRequired === true, 'Routine approvalRequired always true');
    assert(automation.listRoutines().some((item) => item.id === routine.id), 'List routines works');

    console.log('\n6. Manual routine run creates automation run');
    const routineRun = automation.runRoutineNow(routine);
    assert(routineRun.sourceType === 'routine', 'Routine run source type recorded');
    assert(routineRun.status === 'pending_approval', 'Manual routine run creates automation run');

    console.log('\n7. Loop fire creates automation run');
    const activeLoop = automation.createLoop({
      name: 'Due Loop',
      task: 'Create a health draft',
      intervalMinutes: 2,
      toolGatewayToolIds: ['tool_stacklane_project_inspect'],
    });
    const dueLoop = { ...activeLoop, nextRunAt: new Date(Date.now() - 60_000).toISOString() };
    automation.automationStorage.loops.save(dueLoop);
    const schedulerRuns = automation.runSchedulerTick(new Date());
    assert(schedulerRuns.length >= 1, 'Loop fire creates automation run');
    assert(schedulerRuns[0].approvalRequired === true, 'Scheduler run remains approval-first');

    console.log('\n8. Storage persists after reload');
    assert(automation.automationStorage.loops.list().length >= 1, 'Loop storage persists after reload');
    assert(automation.automationStorage.routines.list().length >= 1, 'Routine storage persists after reload');
    assert(automation.automationStorage.runs.list().length >= 1, 'Run storage persists after reload');

    console.log('\n9. No secrets in storage');
    const storageFiles = Object.values(automation.automationStorage.paths).filter((filePath) => fs.existsSync(filePath));
    const noSecrets = storageFiles.every((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return !content.includes('ghp_') && !content.includes('sk-') && !content.includes('Bearer ');
    });
    assert(noSecrets, 'No secrets in storage');

    console.log('\n10. API files and errors are JSON-only');
    const routeContents = routePaths.map((filePath) => fs.readFileSync(filePath, 'utf-8'));
    assert(routeContents.every((content) => content.includes('ok(') || content.includes('badRequest(') || content.includes('notFound(')), 'API routes use JSON helpers');
    assert(routeContents.every((content) => !content.toLowerCase().includes('stack trace')), 'No stack traces in API route files');

    console.log('\n11. Examples and docs');
    const examplePaths = [
      'examples/automation/morning-talocode-brief.json',
      'examples/automation/cliploop-weekly-promo.json',
      'examples/automation/stacklane-health-check.json',
      'examples/automation/codra-issue-triage.json',
      'examples/automation/postlane-email-draft.json',
    ];
    assert(examplePaths.every((relativePath) => fs.existsSync(path.join(repoRoot, relativePath))), 'Examples exist');
    const docsToCheck = [
      'docs/LOOPS_AND_ROUTINES.md',
      'README.md',
      'docs/TOOL_GATEWAY.md',
    ].map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8').toLowerCase());
    assert(docsToCheck.every((content) => !content.includes('tasklet') && !content.includes('shortwave')), 'Docs do not mention external product names');

    console.log('\n12. No arbitrary shell execution');
    const schedulerSource = fs.readFileSync(path.join(repoRoot, 'packages/data/src/automation/scheduler.ts'), 'utf-8');
    assert(!schedulerSource.includes('exec(') && !schedulerSource.includes('spawn('), 'Automation scheduler does not use arbitrary shell execution');

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
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
