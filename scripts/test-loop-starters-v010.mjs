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

const REQUIRED_FIELDS = [
  'id',
  'name',
  'description',
  'category',
  'risk',
  'suggestedCadence',
  'defaultMode',
  'requiredTools',
  'permissionProfile',
  'stateSchema',
  'routineTemplate',
  'verificationChecks',
  'failurePolicy',
  'finalReportFields',
];

const EXPECTED_STARTER_IDS = [
  'daily-triage',
  'ci-sweeper',
  'pr-babysitter',
  'dependency-sweeper',
  'issue-triage',
  'changelog-drafter',
  'post-merge-cleanup',
];



async function run() {
  const repoRoot = process.cwd();
  const scratchDir = process.env.GOAL_SCRATCH || '/tmp/grok-goal-fdb10a392822/implementer';
  fs.mkdirSync(scratchDir, { recursive: true });

  const routePaths = [
    'apps/dashboard/src/app/api/loop-starters/route.ts',
    'apps/dashboard/src/app/api/loop-starters/[id]/route.ts',
    'apps/dashboard/src/app/api/loop-starters/[id]/instantiate/route.ts',
  ].map((relativePath) => path.join(repoRoot, relativePath));

  const loopStarters = await import('../packages/data/src/loop-starters/index.ts');
  const automation = await import('../packages/data/src/automation/index.ts');

  const backups = {};
  for (const [key, filePath] of Object.entries(automation.automationStorage.paths)) {
    backups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  try {
    console.log('\n1. Starter list returns seven starters');
    const starters = loopStarters.listLoopStarters();
    assert(starters.length === 7, 'List returns seven starters');
    assert(
      EXPECTED_STARTER_IDS.every((id) => starters.some((starter) => starter.id === id)),
      'All expected starter ids are present',
    );

    console.log('\n2. Starter shape and safety');
    for (const starter of starters) {
      for (const field of REQUIRED_FIELDS) {
        assert(starter[field] !== undefined && starter[field] !== null, `${starter.id} has ${field}`);
      }
      assert(['low', 'medium', 'high'].includes(starter.risk), `${starter.id} has risk level`);
      assert(starter.verificationChecks.length > 0, `${starter.id} has verification checks`);
      assert(starter.failurePolicy.length > 0, `${starter.id} has failure policy`);
      assert(starter.finalReportFields.length > 0, `${starter.id} has final report fields`);
      assert(
        starter.defaultMode === 'report_only' || starter.defaultMode === 'approval_required',
        `${starter.id} defaults to safe mode`,
      );

      const safety = loopStarters.validateStarterSafety(starter);
      assert(safety.safe, `${starter.id} does not allow auto-push/merge/publish/deploy`);
    }

    const validation = loopStarters.validateAllStarters(starters);
    assert(validation.valid, `validateAllStarters passes (${validation.reasons.join('; ') || 'ok'})`);

    console.log('\n3. Instantiate creates routine draft with approvalRequired true');
    const input = {
      title: 'Daily Triage — test-repo',
      repo: 'talocode/worklane',
      cadence: 'daily',
      toolIds: ['tool_worklane_run_create'],
      mode: 'report_only',
      notes: 'Dry run from test script',
    };

    const run1 = loopStarters.instantiateLoopStarter('daily-triage', input);
    const run2 = loopStarters.instantiateLoopStarter('daily-triage', input);

    fs.writeFileSync(path.join(scratchDir, 'instantiate-run1.json'), JSON.stringify(run1, null, 2));
    fs.writeFileSync(path.join(scratchDir, 'instantiate-run2.json'), JSON.stringify(run2, null, 2));

    assert(run1.routineDraft.status === 'draft', 'Instantiate creates routine draft');
    assert(run1.approvalRequired === true, 'Instantiate sets approvalRequired true');
    assert(run2.approvalRequired === true, 'Second instantiate remains approval-first');
    assert(Array.isArray(run1.verificationChecklist) && run1.verificationChecklist.length > 0, 'Verification checklist returned');
    assert(Array.isArray(run1.warnings) && run1.warnings.length > 0, 'Warnings returned');
    assert(run1.requiredTools.length > 0, 'Required tools returned');

    const routineCountBefore = automation.listRoutines().length;
    const runCountBefore = automation.automationStorage.runs.list().length;
    assert(routineCountBefore === 0, 'Instantiate does not save routines automatically');
    assert(runCountBefore === 0, 'Instantiate does not create automation runs');

    console.log('\n4. API routes return JSON-only');
    assert(routePaths.every((filePath) => fs.existsSync(filePath)), 'Loop starter API route files exist');
    const routeContents = routePaths.map((filePath) => fs.readFileSync(filePath, 'utf-8'));
    assert(
      routeContents.every((content) => content.includes('ok(') || content.includes('badRequest(') || content.includes('notFound(')),
      'API routes use JSON helpers',
    );
    assert(routeContents.every((content) => !content.toLowerCase().includes('stack trace')), 'No stack traces in API route files');

    console.log('\n5. Dashboard route exists');
    const dashboardPage = path.join(repoRoot, 'apps/dashboard/src/app/dashboard/loop-starters/page.tsx');
    assert(fs.existsSync(dashboardPage), 'Dashboard loop-starters page exists');
    const dashboardSource = fs.readFileSync(dashboardPage, 'utf-8');
    assert(dashboardSource.includes('Instantiate routine draft'), 'Dashboard has instantiate button');
    assert(dashboardSource.includes('Routine Draft Preview'), 'Dashboard has draft preview');

    const homeSource = fs.readFileSync(path.join(repoRoot, 'apps/dashboard/src/app/page.tsx'), 'utf-8');
    const automationSource = fs.readFileSync(path.join(repoRoot, 'apps/dashboard/src/app/dashboard/automation/page.tsx'), 'utf-8');
    assert(homeSource.includes('/dashboard/loop-starters'), 'Home page links to loop starters');
    assert(automationSource.includes('/dashboard/loop-starters'), 'Automation page links to loop starters');

    console.log('\n6. Examples exist and parse');
    for (const starterId of EXPECTED_STARTER_IDS) {
      const examplePath = path.join(repoRoot, `examples/loop-starters/${starterId}.json`);
      assert(fs.existsSync(examplePath), `Example exists: ${starterId}`);
      const example = JSON.parse(fs.readFileSync(examplePath, 'utf-8'));
      assert(example.starterId === starterId, `${starterId} example has starter id`);
      assert(example.safeDefaultMode, `${starterId} example has safe default mode`);
      assert(example.suggestedCadence, `${starterId} example has suggested cadence`);
      assert(Array.isArray(example.requiredApprovals), `${starterId} example has required approvals`);
      assert(example.finalReportTemplate, `${starterId} example has final report template`);
    }

    console.log('\n7. Docs exist');
    const docsPath = path.join(repoRoot, 'docs/LOOP_STARTER_KITS.md');
    assert(fs.existsSync(docsPath), 'LOOP_STARTER_KITS.md exists');
    const docs = fs.readFileSync(docsPath, 'utf-8').toLowerCase();
    const docTopics = [
      'loop starter kits',
      'daily-triage',
      'risk',
      'approval-first',
      'report_only',
      'state schema',
      'verification',
      'failure policy',
      'limitations',
    ];
    for (const topic of docTopics) {
      assert(docs.includes(topic), `Docs mention ${topic}`);
    }

    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf-8');
    assert(readme.includes('LOOP_STARTER_KITS.md'), 'README links loop starter docs');

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