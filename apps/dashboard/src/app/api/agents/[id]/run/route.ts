import { NextResponse } from 'next/server';
import { storage } from '../../../../../../packages/data/src/storage';
import { ok, badRequest, notFound } from '../../../lib/api/response';
import { checkAuth } from '../../../lib/api/auth';

function generateStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function planSteps(task: string): { order: number; description: string; tool?: string }[] {
  const words = task.toLowerCase();
  const steps: { order: number; description: string; tool?: string }[] = [];
  steps.push({ order: 1, description: 'Analyze task requirements' });
  if (words.includes('research') || words.includes('find') || words.includes('look up')) {
    steps.push({ order: 2, description: 'Search for relevant information', tool: 'web_search' });
  }
  if (words.includes('write') || words.includes('draft') || words.includes('create')) {
    steps.push({ order: steps.length + 1, description: 'Generate content', tool: 'content_generator' });
  }
  if (words.includes('send') || words.includes('email') || words.includes('post')) {
    steps.push({ order: steps.length + 1, description: 'Deliver output', tool: 'messenger' });
  }
  steps.push({ order: steps.length + 1, description: 'Compile results' });
  return steps;
}

function assessRisk(task: string): 'low' | 'medium' | 'high' {
  const lower = task.toLowerCase();
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('drop')) return 'high';
  if (lower.includes('send') || lower.includes('publish') || lower.includes('deploy')) return 'medium';
  return 'low';
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = checkAuth(request);
  if (authError) return authError;

  const body = await request.json();
  if (!body.task || typeof body.task !== 'string') {
    return badRequest('task is required');
  }

  const agent = storage.agents.get(params.id);
  if (!agent) {
    return notFound('Agent not found');
  }

  const riskLevel = assessRisk(body.task);
  const steps = planSteps(body.task);

  const run = storage.runs.create({
    workspaceId: 'ws_default',
    agentId: params.id,
    task: body.task,
    status: 'pending_approval',
    executionMode: 'simulated',
    riskLevel,
    plan: steps.map((s) => ({
      id: generateStepId(),
      runId: '',
      order: s.order,
      description: s.description,
      tool: s.tool,
      status: 'pending' as const,
    })),
    approvalStatus: 'pending',
    createdBy: 'user',
  });

  storage.approvals.create({
    runId: run.id,
    workspaceId: 'ws_default',
    riskLevel,
    requiredPermissions: riskLevel === 'high' ? ['admin'] : ['member'],
    status: 'pending',
    requestedBy: 'user',
  });

  storage.audit.create({
    workspaceId: 'ws_default',
    actorId: agent.id,
    actorType: 'agent',
    action: 'run.created',
    target: run.id,
    targetType: 'run',
    result: 'pending',
    metadata: { task: body.task, riskLevel },
  });

  return ok({ run });
}
