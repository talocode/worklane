import express from 'express';
import cors from 'cors';
import { ConfigManager, Router, createRequest } from '@talocode/worklane-core';
import { ProviderFactory } from '@talocode/worklane-providers';
import { createDefaultRegistry } from '@talocode/worklane-agents';
import { createDefaultWorkflows } from '@talocode/worklane-workflows';
import {
  approveMaintenanceRun,
  createMaintenanceRun,
  getMaintenanceReport,
  getMaintenanceRun,
  isMaintenanceRoutineId,
  listMaintenanceRoutines,
  listMaintenanceRuns,
  rejectMaintenanceRun,
} from '@talocode/worklane-data';

async function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  const configManager = new ConfigManager();
  const config = await configManager.loadConfig();

  const envKey = config.providers[config.provider]?.envKey;
  const apiKey = envKey ? process.env[envKey] || '' : '';

  const provider = ProviderFactory.create(config.provider, {
    baseUrl: config.providers[config.provider]?.baseUrl || '',
    apiKey,
  });

  const agentRegistry = createDefaultRegistry(provider);
  const workflowRegistry = createDefaultWorkflows(provider);

  const router = new Router();

  for (const agent of agentRegistry.list()) {
    router.registerAgent(agent);
  }

  for (const workflow of workflowRegistry.list()) {
    router.registerWorkflow(workflow);
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
  });

  app.get('/agents', (_req, res) => {
    const agents = agentRegistry.list().map(a => ({
      name: a.name,
      description: a.description,
      capabilities: a.capabilities,
    }));
    res.json({ agents });
  });

  app.get('/workflows', (_req, res) => {
    const workflows = workflowRegistry.list().map(w => ({
      name: w.name,
      description: w.description,
      triggers: w.triggers,
    }));
    res.json({ workflows });
  });

  app.post('/run', async (req, res) => {
    const { userId, command, args, source } = req.body;

    if (!command) {
      res.status(400).json({ error: 'command is required' });
      return;
    }

    const request = createRequest(
      userId || 'api-user',
      command,
      args || [],
      source || 'api'
    );

    const response = await router.route(request);
    res.json(response);
  });

  app.get('/v1/worklane/maintenance/routines', (_req, res) => {
    res.json({ ok: true, routines: listMaintenanceRoutines() });
  });

  app.get('/v1/worklane/maintenance/runs', (_req, res) => {
    res.json({ ok: true, runs: listMaintenanceRuns() });
  });

  app.post('/v1/worklane/maintenance/runs', (req, res) => {
    const { routineId, repo, baseRef, maxFiles, maxPatchLines, maxRuntimeMinutes, notes } = req.body || {};
    if (typeof routineId !== 'string' || !isMaintenanceRoutineId(routineId) || typeof repo !== 'string') {
      res.status(400).json({ ok: false, error: 'routineId and repo are required' });
      return;
    }
    try {
      const run = createMaintenanceRun({ routineId, repo, baseRef, maxFiles, maxPatchLines, maxRuntimeMinutes, notes });
      res.json({ ok: true, run });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Failed to create maintenance run' });
    }
  });

  app.get('/v1/worklane/maintenance/runs/:id', (req, res) => {
    const run = getMaintenanceRun(req.params.id);
    if (!run) {
      res.status(404).json({ ok: false, error: 'Maintenance run not found' });
      return;
    }
    res.json({ ok: true, run });
  });

  app.get('/v1/worklane/maintenance/runs/:id/report', (req, res) => {
    const report = getMaintenanceReport(req.params.id);
    if (!report) {
      res.status(404).json({ ok: false, error: 'Maintenance report not found' });
      return;
    }
    res.json({ ok: true, report });
  });

  app.post('/v1/worklane/maintenance/runs/:id/approve', (req, res) => {
    try {
      const run = approveMaintenanceRun(req.params.id, typeof req.body?.approvedBy === 'string' ? req.body.approvedBy : 'api-user');
      if (!run) {
        res.status(404).json({ ok: false, error: 'Maintenance run not found' });
        return;
      }
      res.json({ ok: true, run });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Failed to approve maintenance run' });
    }
  });

  app.post('/v1/worklane/maintenance/runs/:id/reject', (req, res) => {
    try {
      const run = rejectMaintenanceRun(
        req.params.id,
        typeof req.body?.rejectedBy === 'string' ? req.body.rejectedBy : 'api-user',
        typeof req.body?.reason === 'string' ? req.body.reason : undefined,
      );
      if (!run) {
        res.status(404).json({ ok: false, error: 'Maintenance run not found' });
        return;
      }
      res.json({ ok: true, run });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'Failed to reject maintenance run' });
    }
  });

  app.listen(port, () => {
    console.log(`WorkLane API server listening on port ${port}`);
    console.log(`Provider: ${config.provider}`);
    console.log(`Model: ${config.model}`);
  });
}

main().catch(console.error);
