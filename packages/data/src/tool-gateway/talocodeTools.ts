import type { ToolGatewaySource, ToolGatewayTool } from './types';

const now = () => new Date().toISOString();

export function getTalocodeSource(): ToolGatewaySource {
  const timestamp = now();
  return {
    id: 'src_talocode',
    name: 'Talocode Local Tools',
    type: 'talocode',
    enabled: true,
    description: 'Deterministic placeholder tools for Talocode product workflows.',
    auth: { type: 'none' },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getTalocodeTools(): ToolGatewayTool[] {
  const timestamp = now();
  return [
    {
      id: 'tool_launchpix_asset_plan',
      sourceId: 'src_talocode',
      name: 'talocode.launchpix.asset.plan',
      displayName: 'Launch Asset Plan',
      description: 'Create a safe placeholder launch asset planning response.',
      inputSchema: { type: 'object', properties: { productName: { type: 'string' }, assetType: { type: 'string' } }, required: ['productName'] },
      outputSchema: { type: 'object', properties: { ok: { type: 'boolean' }, plan: { type: 'object' } } },
      riskLevel: 'read',
      requiresApproval: false,
      enabled: true,
      tags: ['talocode', 'launchpix', 'planning'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'tool_cliploop_director_plan',
      sourceId: 'src_talocode',
      name: 'talocode.cliploop.director.plan',
      displayName: 'ClipLoop Director Plan',
      description: 'Return a deterministic draft planning response for a video direction request.',
      inputSchema: { type: 'object', properties: { idea: { type: 'string' }, tone: { type: 'string' } }, required: ['idea'] },
      outputSchema: { type: 'object', properties: { ok: { type: 'boolean' }, draft: { type: 'object' } } },
      riskLevel: 'read',
      requiresApproval: false,
      enabled: true,
      tags: ['talocode', 'cliploop', 'planning'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'tool_postlane_email_draft',
      sourceId: 'src_talocode',
      name: 'talocode.postlane.email.draft',
      displayName: 'Email Draft',
      description: 'Prepare a safe email draft response without sending anything.',
      inputSchema: { type: 'object', properties: { subject: { type: 'string' }, audience: { type: 'string' } }, required: ['subject'] },
      outputSchema: { type: 'object', properties: { ok: { type: 'boolean' }, draft: { type: 'object' } } },
      riskLevel: 'write',
      requiresApproval: true,
      enabled: true,
      tags: ['talocode', 'postlane', 'drafting'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'tool_stacklane_project_inspect',
      sourceId: 'src_talocode',
      name: 'talocode.stacklane.project.inspect',
      displayName: 'Project Inspect',
      description: 'Return a placeholder inspection summary for a Stacklane-style project record.',
      inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] },
      outputSchema: { type: 'object', properties: { ok: { type: 'boolean' }, inspection: { type: 'object' } } },
      riskLevel: 'read',
      requiresApproval: false,
      enabled: true,
      tags: ['talocode', 'stacklane', 'inspect'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'tool_worklane_run_create',
      sourceId: 'src_talocode',
      name: 'talocode.worklane.run.create',
      displayName: 'WorkLane Run Create',
      description: 'Prepare a safe placeholder WorkLane run creation result.',
      inputSchema: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] },
      outputSchema: { type: 'object', properties: { ok: { type: 'boolean' }, run: { type: 'object' } } },
      riskLevel: 'write',
      requiresApproval: true,
      enabled: true,
      tags: ['talocode', 'worklane', 'runs'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

export function runTalocodeTool(tool: ToolGatewayTool, input: Record<string, unknown>): unknown {
  const warning = 'Tool Gateway v0.1 placeholder result only. Connect a real API later if needed.';

  switch (tool.name) {
    case 'talocode.launchpix.asset.plan':
      return {
        ok: true,
        warning,
        plan: {
          productName: input.productName || 'Unknown product',
          assetType: input.assetType || 'hero',
          nextStep: 'Review the draft asset plan before any render request.',
        },
      };
    case 'talocode.cliploop.director.plan':
      return {
        ok: true,
        warning,
        draft: {
          idea: input.idea || 'No idea provided',
          tone: input.tone || 'neutral',
          nextStep: 'Review the planning draft before creating a real production run.',
        },
      };
    case 'talocode.postlane.email.draft':
      return {
        ok: true,
        warning,
        draft: {
          subject: input.subject || 'Draft subject',
          body: 'This is a deterministic draft only. No email was sent.',
        },
      };
    case 'talocode.stacklane.project.inspect':
      return {
        ok: true,
        warning,
        inspection: {
          projectId: input.projectId || 'unknown',
          status: 'placeholder',
          note: 'No external project API was called in v0.1.',
        },
      };
    case 'talocode.worklane.run.create':
      return {
        ok: true,
        warning,
        run: {
          task: input.task || 'No task provided',
          status: 'draft',
          note: 'This is a gateway placeholder and did not create a real run automatically.',
        },
      };
    default:
      return { ok: false, warning, error: 'Unknown Talocode placeholder tool.' };
  }
}
