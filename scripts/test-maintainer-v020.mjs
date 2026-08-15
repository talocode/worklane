#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS ${label}`);
    passed += 1;
  } else {
    console.log(`  FAIL ${label}`);
    failed += 1;
  }
}

async function run() {
  const repoRoot = process.cwd();
  const maintenance = await import('../packages/data/src/maintenance/index.ts');
  const automation = await import('../packages/data/src/automation/index.ts');
  const paths = [...Object.values(maintenance.maintenanceStorage.paths), ...Object.values(automation.automationStorage.paths)];
  const backups = new Map();

  for (const filePath of paths) {
    backups.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  try {
    console.log('\n1. Built-in routines');
    const routines = maintenance.listMaintenanceRoutines();
    assert(routines.length === 3, 'Three routines are available');
    assert(routines.every((routine) => routine.permissionProfile === 'draft_only'), 'Every routine is draft-only');
    assert(routines.every((routine) => routine.verificationChecks.length >= 4), 'Every routine has verification checks');
    assert(routines.every((routine) => routine.constraints.some((item) => item.includes('Never push'))), 'Every routine blocks autonomous remote writes');

    console.log('\n2. Approval-first run creation');
    const runRecord = maintenance.createMaintenanceRun({
      routineId: 'flaky-test-diagnosis',
      repo: 'talocode/worklane',
    });
    assert(runRecord.status === 'pending_approval', 'New run waits for approval');
    assert(runRecord.approvalRequired === true, 'Approval cannot be disabled');
    assert(runRecord.executionMode === 'simulated', 'Execution is honestly labeled simulated');
    assert(runRecord.limits.maxFiles === 20, 'Default file limit is applied');
    assert(runRecord.report.evidenceStatus === 'not_collected', 'Report does not invent evidence');
    assert(runRecord.report.filesChanged.length === 0, 'Report does not invent changed files');

    console.log('\n3. Validation');
    let invalidRepoRejected = false;
    try {
      maintenance.createMaintenanceRun({ routineId: 'dead-code-candidates', repo: '../private' });
    } catch {
      invalidRepoRejected = true;
    }
    assert(invalidRepoRejected, 'Invalid repository paths are rejected');

    let invalidLimitRejected = false;
    try {
      maintenance.createMaintenanceRun({ routineId: 'dead-code-candidates', repo: 'talocode/worklane', maxFiles: 0 });
    } catch {
      invalidLimitRejected = true;
    }
    assert(invalidLimitRejected, 'Out-of-range limits are rejected');

    console.log('\n4. Approval and rejection');
    const approved = maintenance.approveMaintenanceRun(runRecord.id, 'test-reviewer');
    assert(approved?.status === 'approved', 'Run can be approved for handoff');
    assert(approved?.report.evidenceStatus === 'not_collected', 'Approval does not fabricate execution evidence');

    const rejectCandidate = maintenance.createMaintenanceRun({
      routineId: 'duplicate-implementation-detection',
      repo: 'talocode/worklane',
    });
    const rejected = maintenance.rejectMaintenanceRun(rejectCandidate.id, 'test-reviewer', 'Needs a smaller scope.');
    assert(rejected?.status === 'rejected', 'Run can be rejected');
    assert(rejected?.rejectionReason === 'Needs a smaller scope.', 'Rejection reason is preserved');

    console.log('\n5. Product surfaces');
    const requiredFiles = [
      'apps/dashboard/src/app/api/maintenance/routines/route.ts',
      'apps/dashboard/src/app/api/maintenance/runs/route.ts',
      'apps/dashboard/src/app/api/maintenance/runs/[id]/route.ts',
      'apps/dashboard/src/app/api/maintenance/runs/[id]/report/route.ts',
      'apps/dashboard/src/app/api/maintenance/runs/[id]/approve/route.ts',
      'apps/dashboard/src/app/api/maintenance/runs/[id]/reject/route.ts',
      'apps/dashboard/src/app/dashboard/maintainer/page.tsx',
      'docs/MAINTAINER.md',
      'examples/maintenance/flaky-test-diagnosis.json',
    ];
    assert(requiredFiles.every((file) => fs.existsSync(path.join(repoRoot, file))), 'API, dashboard, docs, and example files exist');

    const apiServer = fs.readFileSync(path.join(repoRoot, 'apps/api-server/src/index.ts'), 'utf-8');
    assert(apiServer.includes('/v1/worklane/maintenance/routines'), 'Namespaced maintenance routes are exposed');
    assert(apiServer.includes('/v1/worklane/maintenance/runs/:id/report'), 'Evidence report route is exposed');

    const cli = fs.readFileSync(path.join(repoRoot, 'packages/cli/src/cli.ts'), 'utf-8');
    assert(cli.includes(".command('maintenance')"), 'CLI exposes maintenance commands');

    const docs = fs.readFileSync(path.join(repoRoot, 'docs/MAINTAINER.md'), 'utf-8');
    assert(docs.includes('evidenceStatus'), 'Docs explain evidence status');
    assert(docs.includes('simulated'), 'Docs disclose simulated execution');

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  } finally {
    for (const [filePath, backup] of backups.entries()) {
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
