import express from 'express';
import cors from 'cors';
import { ConfigManager, Router, createRequest } from '@talocode/worklane-core';
import { ProviderFactory } from '@talocode/worklane-providers';
import { createDefaultRegistry } from '@talocode/worklane-agents';
import { createDefaultWorkflows } from '@talocode/worklane-workflows';

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

  app.listen(port, () => {
    console.log(`WorkLane API server listening on port ${port}`);
    console.log(`Provider: ${config.provider}`);
    console.log(`Model: ${config.model}`);
  });
}

main().catch(console.error);
