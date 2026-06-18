#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager, Router, createRequest, maskSecret } from '@talocode/worklane-core';
import { ProviderFactory } from '@talocode/worklane-providers';
import { createDefaultRegistry } from '@talocode/worklane-agents';
import { MemoryStore } from '@talocode/worklane-memory';
import { createDefaultWorkflows } from '@talocode/worklane-workflows';

const program = new Command();

program
  .name('worklane')
  .description('Open-source AI coworker platform for teams')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize WorkLane in the current directory')
  .action(async () => {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();
    await configManager.saveConfig(config);
    console.log('WorkLane initialized successfully!');
    console.log(`Config directory: ${configManager.getConfigDir()}`);
  });

program
  .command('doctor')
  .description('Check WorkLane configuration and health')
  .action(async () => {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();
    
    console.log('WorkLane Doctor');
    console.log('===============');
    console.log(`Provider: ${config.provider}`);
    console.log(`Model: ${config.model}`);
    console.log(`Config dir: ${configManager.getConfigDir()}`);
    
    const envKey = config.providers[config.provider]?.envKey;
    if (envKey) {
      const value = process.env[envKey];
      if (value) {
        console.log(`API Key: ${maskSecret(value)} (configured)`);
      } else {
        console.log(`API Key: NOT SET (env: ${envKey})`);
      }
    }
    
    console.log('\nAll systems operational!');
  });

program
  .command('run <task>')
  .description('Run a task using WorkLane agents')
  .action(async (task: string) => {
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
    
    const request = createRequest('cli-user', task, task.split(' ').slice(1), 'cli');
    const response = await router.route(request);
    
    if (response.success) {
      console.log(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
    } else {
      console.error(`Error: ${response.error}`);
      process.exit(1);
    }
  });

program
  .command('agents')
  .description('List available agents')
  .action(async () => {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();
    
    const envKey = config.providers[config.provider]?.envKey;
    const apiKey = envKey ? process.env[envKey] || '' : '';
    
    const provider = ProviderFactory.create(config.provider, {
      baseUrl: config.providers[config.provider]?.baseUrl || '',
      apiKey,
    });
    
    const agentRegistry = createDefaultRegistry(provider);
    
    console.log('Available Agents');
    console.log('================');
    
    for (const agent of agentRegistry.list()) {
      console.log(`\n${agent.name}`);
      console.log(`  Description: ${agent.description}`);
      console.log(`  Capabilities: ${agent.capabilities.join(', ')}`);
    }
  });

program
  .command('providers')
  .description('List configured providers')
  .action(async () => {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();
    
    console.log('Configured Providers');
    console.log('====================');
    console.log(`Active: ${config.provider}`);
    console.log(`Model: ${config.model}`);
    
    for (const [name, provider] of Object.entries(config.providers)) {
      console.log(`\n${name}`);
      console.log(`  Base URL: ${provider.baseUrl}`);
      console.log(`  Env Key: ${provider.envKey}`);
      
      const value = provider.envKey ? process.env[provider.envKey] : undefined;
      console.log(`  Status: ${value ? 'Configured' : 'Not configured'}`);
    }
  });

program
  .command('memory')
  .description('Manage WorkLane memory')
  .option('-s, --status', 'Show memory status')
  .option('-l, --list', 'List memory entries')
  .action(async (options) => {
    const memoryStore = new MemoryStore();
    
    if (options.status || options.list) {
      const entries = await memoryStore.list();
      
      console.log('Memory Status');
      console.log('=============');
      console.log(`Total entries: ${entries.length}`);
      
      if (options.list && entries.length > 0) {
        console.log('\nEntries:');
        for (const entry of entries) {
          console.log(`  ${entry.key}: ${entry.value.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('Memory Commands');
      console.log('===============');
      console.log('  worklane memory --status  Show memory status');
      console.log('  worklane memory --list    List memory entries');
    }
  });

program.parse();
