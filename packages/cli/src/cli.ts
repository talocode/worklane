#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager, Router, createRequest, maskSecret } from '@talocode/worklane-core';
import { ProviderFactory } from '@talocode/worklane-providers';
import { createDefaultRegistry } from '@talocode/worklane-agents';
import { MemoryStore } from '@talocode/worklane-memory';
import { createDefaultWorkflows } from '@talocode/worklane-workflows';
import { SocialPublisher, configFromEnv, missingConfig, PLATFORM_ENV_VARS } from '@talocode/worklane-socials';
import {
  approveMaintenanceRun,
  createMaintenanceRun,
  getMaintenanceReport,
  isMaintenanceRoutineId,
  listMaintenanceRoutines,
} from '@talocode/worklane-data';

const program = new Command();

program
  .name('worklane')
  .description('Open-source AI coworker platform for teams')
  .version('0.2.0');

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

const maintenance = program
  .command('maintenance')
  .description('Prepare and review approval-first repository maintenance runs');

maintenance
  .command('routines')
  .description('List built-in maintenance routines')
  .action(() => {
    for (const routine of listMaintenanceRoutines()) {
      console.log(`${routine.id}\t${routine.name}\t${routine.defaultCadence}`);
    }
  });

maintenance
  .command('run')
  .description('Prepare a maintenance run for approval')
  .requiredOption('--routine <id>', 'Maintenance routine id')
  .requiredOption('--repo <owner/repository>', 'Repository')
  .option('--base-ref <ref>', 'Base reference', 'main')
  .option('--max-files <count>', 'Maximum files to inspect', (value) => Number.parseInt(value, 10), 20)
  .option('--max-patch-lines <count>', 'Maximum changed lines', (value) => Number.parseInt(value, 10), 300)
  .option('--max-runtime-minutes <count>', 'Maximum runtime in minutes', (value) => Number.parseInt(value, 10), 20)
  .option('--notes <text>', 'Review notes', '')
  .action((options) => {
    if (!isMaintenanceRoutineId(options.routine)) {
      console.error(`Unknown routine: ${options.routine}`);
      process.exitCode = 1;
      return;
    }
    try {
      const run = createMaintenanceRun({
        routineId: options.routine,
        repo: options.repo,
        baseRef: options.baseRef,
        maxFiles: options.maxFiles,
        maxPatchLines: options.maxPatchLines,
        maxRuntimeMinutes: options.maxRuntimeMinutes,
        notes: options.notes,
      });
      console.log(JSON.stringify(run, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Failed to create maintenance run.');
      process.exitCode = 1;
    }
  });

maintenance
  .command('report <run-id>')
  .description('Print the evidence report for a maintenance run')
  .action((runId: string) => {
    const report = getMaintenanceReport(runId);
    if (!report) {
      console.error('Maintenance report not found.');
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(report, null, 2));
  });

maintenance
  .command('approve <run-id>')
  .description('Approve a maintenance run for handoff')
  .action((runId: string) => {
    try {
      const run = approveMaintenanceRun(runId, 'cli-user');
      if (!run) {
        console.error('Maintenance run not found.');
        process.exitCode = 1;
        return;
      }
      console.log(JSON.stringify(run, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Failed to approve maintenance run.');
      process.exitCode = 1;
    }
  });


program
  .command('socials:status')
  .description('Show which social platforms are configured')
  .action(() => {
    const config = configFromEnv();
    const all: Array<'facebook' | 'instagram' | 'threads' | 'telegram' | 'x'> = [
      'facebook', 'instagram', 'threads', 'telegram', 'x',
    ];
    for (const platform of all) {
      const configured = !!config[platform];
      const hosted = config.hosted?.enabled && config.hosted.apiKey;
      console.log(`${configured ? '[ready]' : hosted ? '[hosted]' : '[missing]'} ${platform}${configured || hosted ? '' : '  set ' + PLATFORM_ENV_VARS[platform].join(', ')}`);
    }
    if (config.hosted) {
      console.log(`hosted mode: ${config.hosted.enabled ? 'enabled' : 'available'} via ${config.hosted.baseUrl || 'https://api.talocode.site'}`);
    }
  });

program
  .command('socials:post')
  .description('Publish one post to one or more social platforms')
  .requiredOption('--text <text>', 'Post text')
  .option('--platforms <list>', 'Comma-separated: facebook,instagram,threads,telegram,x', 'facebook')
  .option('--image <url>', 'Public https image URL (required for instagram and threads images)')
  .option('--video <url>', 'Public https video URL (facebook)')
  .option('--hosted', 'Force hosted Talocode Cloud routing', false)
  .action(async (opts) => {
    const config = configFromEnv();
    if (opts.hosted && config.hosted) config.hosted.enabled = true;
    const platforms = String(opts.platforms)
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean) as Array<'facebook' | 'instagram' | 'threads' | 'telegram' | 'x'>;
    const missing = missingConfig(platforms, config);
    if (missing.length && !(config.hosted?.enabled)) {
      for (const platform of missing) {
        console.error(`missing credentials for ${platform}: set ${PLATFORM_ENV_VARS[platform].join(', ')}`);
      }
      process.exitCode = 1;
      return;
    }
    const publisher = new SocialPublisher(config);
    const receipt = await publisher.publish({
      text: opts.text,
      platforms,
      imageUrl: opts.image,
      videoUrl: opts.video,
    });
    for (const result of receipt.results) {
      const status = result.ok ? 'OK ' : 'FAIL';
      const ref = result.permalink || result.id || result.error || '';
      console.log(`${status} ${result.platform}  ${ref}`);
    }
    if (receipt.results.some((r) => !r.ok)) process.exitCode = 1;
  });

program.parse();
