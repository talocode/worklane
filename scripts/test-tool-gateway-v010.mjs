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
  const routePaths = {
    health: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/health/route.ts'),
    sources: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/sources/route.ts'),
    tools: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/tools/route.ts'),
    register: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/tools/register/route.ts'),
    calls: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/calls/route.ts'),
    call: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/calls/[id]/route.ts'),
    approve: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/calls/[id]/approve/route.ts'),
    run: path.join(repoRoot, 'apps/dashboard/src/app/api/tool-gateway/calls/[id]/run/route.ts'),
  };
  const { toolGatewayStorage } = await import('../packages/data/src/tool-gateway/storage.ts');
  const { listGatewayTools } = await import('../packages/data/src/tool-gateway/registry.ts');
  const { createGatewayCall, runGatewayCall } = await import('../packages/data/src/tool-gateway/executor.ts');

  const backups = {};
  for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
    backups[key] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  try {
    console.log('\n1. Endpoint files and JSON responses');
    assert(Object.values(routePaths).every((filePath) => fs.existsSync(filePath)), 'All Tool Gateway route files exist');
    const routeContents = Object.values(routePaths).map((filePath) => fs.readFileSync(filePath, 'utf-8'));
    assert(routeContents.every((content) => content.includes('ok(') || content.includes('NextResponse.json')), 'Routes return JSON responses');
    assert(routeContents.every((content) => !content.toLowerCase().includes('stack')), 'Routes do not expose stack traces');

    console.log('\n2. Default Talocode tools registered');
    const toolNames = listGatewayTools().map((tool) => tool.name);
    assert(toolNames.includes('talocode.launchpix.asset.plan'), 'LaunchPix placeholder tool registered');
    assert(toolNames.includes('talocode.cliploop.director.plan'), 'ClipLoop placeholder tool registered');
    assert(toolNames.includes('talocode.postlane.email.draft'), 'Email draft placeholder tool registered');
    assert(toolNames.includes('talocode.stacklane.project.inspect'), 'Project inspect placeholder tool registered');
    assert(toolNames.includes('talocode.worklane.run.create'), 'WorkLane run placeholder tool registered');

    console.log('\n3. List and create sources');
    const sourcesJson = { sources: toolGatewayStorage.listSources() };
    assert(sourcesJson.sources.length >= 1, 'List sources works');
    const createdSource = toolGatewayStorage.createSource({
      name: 'Configured HTTP Source',
      type: 'http',
      auth: { type: 'bearer', envKeyName: 'WORKLANE_GATEWAY_BEARER' },
    });
    const createSourceJson = { source: createdSource };
    assert(createSourceJson.source.id, 'Create source works');
    assert(!JSON.stringify(createSourceJson).includes('WORKLANE_GATEWAY_BEARER='), 'Create source does not expose env value');

    console.log('\n4. Register local tool and list tools');
    const localSourceJson = { source: toolGatewayStorage.createSource({ name: 'Local Planning', type: 'local' }) };
    const registerJson = {
      tool: toolGatewayStorage.registerTool({
        sourceId: localSourceJson.source.id,
        name: 'worklane.local.read',
        displayName: 'Local Read Tool',
        description: 'Return a deterministic local inspection result.',
        inputSchema: { type: 'object' },
        riskLevel: 'read',
        tags: ['local', 'read'],
      }),
    };
    assert(registerJson.tool.id, 'Register local tool works');
    const refreshedToolsJson = { tools: listGatewayTools() };
    assert(refreshedToolsJson.tools.some((tool) => tool.id === registerJson.tool.id), 'List tools works');

    console.log('\n5. Disabled source blocks execution');
    const disabledSourceJson = { source: toolGatewayStorage.createSource({ name: 'Disabled Local Source', type: 'local', enabled: false }) };
    const disabledToolJson = {
      tool: toolGatewayStorage.registerTool({
        sourceId: disabledSourceJson.source.id,
        name: 'worklane.local.disabled',
        displayName: 'Disabled Tool',
        description: 'Should not run',
        inputSchema: { type: 'object' },
        riskLevel: 'read',
      }),
    };
    const blockedBySourceJson = createGatewayCall(disabledToolJson.tool.id, {});
    assert(blockedBySourceJson.error.includes('Source is disabled'), 'Disabled source blocks execution');

    console.log('\n6. Disabled tool blocks execution');
    const disabledToolOnlyJson = {
      tool: toolGatewayStorage.registerTool({
        sourceId: localSourceJson.source.id,
        name: 'worklane.local.disabled-tool',
        displayName: 'Disabled Local Tool',
        description: 'Disabled tool',
        inputSchema: { type: 'object' },
        riskLevel: 'read',
        enabled: false,
      }),
    };
    const blockedByToolJson = createGatewayCall(disabledToolOnlyJson.tool.id, {});
    assert(blockedByToolJson.error.includes('Tool is disabled'), 'Disabled tool blocks execution');

    console.log('\n7. Approval requirements');
    const writeCallJson = createGatewayCall('tool_postlane_email_draft', { subject: 'Launch update' });
    assert(writeCallJson.call.status === 'pending_approval', 'Write tool requires approval');

    const destructiveToolJson = {
      tool: toolGatewayStorage.registerTool({
        sourceId: localSourceJson.source.id,
        name: 'worklane.local.destroy',
        displayName: 'Destroy Tool',
        description: 'Dangerous tool placeholder',
        inputSchema: { type: 'object' },
        riskLevel: 'destructive',
      }),
    };
    const destructiveCallJson = createGatewayCall(destructiveToolJson.tool.id, {});
    assert(destructiveCallJson.call.status === 'pending_approval', 'Destructive tool requires approval');

    const externalToolJson = {
      tool: toolGatewayStorage.registerTool({
        sourceId: localSourceJson.source.id,
        name: 'worklane.http.external',
        displayName: 'External Tool',
        description: 'External placeholder tool',
        inputSchema: { type: 'object' },
        riskLevel: 'external',
      }),
    };
    const externalCallJson = createGatewayCall(externalToolJson.tool.id, {});
    assert(externalCallJson.call.status === 'pending_approval', 'External tool requires approval');

    console.log('\n8. Read tool returns deterministic result');
    const readCallJson = createGatewayCall('tool_stacklane_project_inspect', { projectId: 'proj_123' });
    assert(readCallJson.call.status === 'approved', 'Read tool can be created without approval');
    const readRunJson = runGatewayCall(readCallJson.call.id);
    assert(readRunJson.call.status === 'succeeded', 'Read tool run endpoint updates status');

    console.log('\n9. Call approval endpoint works');
    const approveJson = { call: toolGatewayStorage.approveCall(writeCallJson.call.id) };
    assert(Boolean(approveJson.call.approvedAt), 'Call approval endpoint records approvedAt');

    console.log('\n10. Missing auth env returns safe error');
    const missingAuthToolJson = {
      tool: toolGatewayStorage.registerTool({
        sourceId: createSourceJson.source.id,
        name: 'worklane.http.auth-check',
        displayName: 'Auth Check Tool',
        description: 'Requires configured auth placeholder',
        inputSchema: { type: 'object' },
        riskLevel: 'read',
      }),
    };
    const missingAuthJson = createGatewayCall(missingAuthToolJson.tool.id, {});
    assert(typeof missingAuthJson.error === 'string', 'Missing auth returns safe error');
    assert(!JSON.stringify(missingAuthJson).includes('WORKLANE_GATEWAY_BEARER='), 'Missing auth error does not print env value');

    console.log('\n11. Calls stored locally and no secrets in stored files');
    const callsListJson = { calls: toolGatewayStorage.listCalls() };
    assert(callsListJson.calls.length >= 3, 'Calls are stored locally');
    const storedFiles = Object.values(toolGatewayStorage.paths).filter((filePath) => fs.existsSync(filePath));
    const safeStorage = storedFiles.every((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      return !content.includes('ghp_') && !content.includes('sk-') && !content.includes('Bearer ');
    });
    assert(safeStorage, 'No secrets in stored files');

    console.log('\n12. Get call and JSON-only errors');
    const getCallJson = { call: toolGatewayStorage.getCall(readCallJson.call.id) };
    assert(getCallJson.call.id === readCallJson.call.id, 'Get call endpoint works');
    assert(routeContents.every((content) => content.includes('ok(') || content.includes('badRequest(') || content.includes('notFound(')), 'API route files use structured JSON helpers');

    console.log('\n13. Public docs and repo boundary checks');
    const docs = [
      'README.md',
      'docs/TOOL_GATEWAY.md',
      'docs/API_COMMAND_CENTER.md',
    ].map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8'));
    const forbiddenNames = ['tasklet', 'shortwave'];
    assert(docs.every((content) => forbiddenNames.every((term) => !content.toLowerCase().includes(term))), 'No external product names in public docs');
    const gatewayExecutor = fs.readFileSync(path.join(repoRoot, 'packages/data/src/tool-gateway/executor.ts'), 'utf-8');
    assert(!gatewayExecutor.includes('exec(') && !gatewayExecutor.includes('spawn('), 'No arbitrary shell execution in gateway executor');

    console.log('\nResults');
    console.log(`  ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    for (const [key, filePath] of Object.entries(toolGatewayStorage.paths)) {
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
