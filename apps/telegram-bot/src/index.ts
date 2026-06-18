import { ConfigManager, Router, createRequest } from '@talocode/worklane-core';
import { ProviderFactory } from '@talocode/worklane-providers';
import { createDefaultRegistry } from '@talocode/worklane-agents';
import { createDefaultWorkflows } from '@talocode/worklane-workflows';
import { TelegramConnector } from '@talocode/worklane-connectors';

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN environment variable is required');
    process.exit(1);
  }

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

  const connector = new TelegramConnector(token);

  connector.onMessage(async (request) => {
    const { command, args } = request;

    if (command === '/start') {
      return {
        requestId: request.id,
        success: true,
        data: 'Welcome to WorkLane! 🤖\n\nI am your AI coworker. Mention me or use commands to get work done.\n\nCommands:\n/agents - List available agents\n/help - Show help\n/work <task> - Run a task\n/remember <fact> - Store a fact\n/status - Show status',
      };
    }

    if (command === '/agents') {
      const agents = agentRegistry.list();
      const agentList = agents.map(a => `• ${a.name}: ${a.description}`).join('\n');
      return {
        requestId: request.id,
        success: true,
        data: `Available Agents:\n\n${agentList}`,
      };
    }

    if (command === '/help') {
      return {
        requestId: request.id,
        success: true,
        data: 'WorkLane Commands:\n\n/start - Welcome message\n/agents - List available agents\n/help - Show this help\n/work <task> - Run a task\n/remember <fact> - Store a fact\n/status - Show status\n\nYou can also mention me in a message to get help with tasks!',
      };
    }

    if (command === '/work') {
      const task = args.join(' ');
      if (!task) {
        return {
          requestId: request.id,
          success: false,
          error: 'Please provide a task. Example: /work summarize this discussion',
        };
      }
      return router.route(request);
    }

    if (command === '/remember') {
      const fact = args.join(' ');
      if (!fact) {
        return {
          requestId: request.id,
          success: false,
          error: 'Please provide a fact to remember. Example: /remember project deadline is Friday',
        };
      }
      return {
        requestId: request.id,
        success: true,
        data: `Remembered: "${fact}"`,
      };
    }

    if (command === '/status') {
      return {
        requestId: request.id,
        success: true,
        data: `WorkLane Status:\n\nProvider: ${config.provider}\nModel: ${config.model}\nAgents: ${agentRegistry.list().length}\nWorkflows: ${workflowRegistry.list().length}`,
      };
    }

    return router.route(request);
  });

  await connector.connect();
  console.log('WorkLane Telegram Bot started!');
  console.log(`Provider: ${config.provider}`);
  console.log(`Model: ${config.model}`);
}

main().catch(console.error);
