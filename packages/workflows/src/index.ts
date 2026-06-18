import { Workflow, Request, Response, Provider } from '@talocode/worklane-core';

export class SummarizeWorkflow implements Workflow {
  name = 'summarize';
  description = 'Summarizes discussions and extracts action items';
  triggers = ['summarize', 'summary', 'extract'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const content = request.args.join(' ') || 'discussion';
    
    const prompt = `Summarize the following discussion and extract key information:

Discussion: ${content}

Please provide:
1. Summary (2-3 sentences)
2. Key decisions made
3. Open questions
4. Next actions with suggested owners`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class DraftReplyWorkflow implements Workflow {
  name = 'draft-reply';
  description = 'Drafts replies to messages or emails';
  triggers = ['draft', 'reply', 'respond'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const content = request.args.join(' ') || 'message';
    
    const prompt = `Draft a professional reply for the following:

Original message: ${content}

Please provide:
1. Draft response
2. Tone notes
3. Any risks or considerations`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class LaunchPlanWorkflow implements Workflow {
  name = 'launch-plan';
  description = 'Creates launch plans for products';
  triggers = ['launch', 'release', 'ship'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const product = request.args.join(' ') || 'product';
    
    const prompt = `Create a comprehensive launch plan for:

Product: ${product}

Please provide:
1. Pre-launch checklist
2. X/Twitter posts
3. GitHub release tasks
4. Demo video tasks
5. Marketing timeline`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class ResearchWorkflow implements Workflow {
  name = 'research';
  description = 'Conducts research on topics';
  triggers = ['research', 'investigate', 'study'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const topic = request.args.join(' ') || 'topic';
    
    const prompt = `Research the following topic and provide comprehensive findings:

Topic: ${topic}

Please provide:
1. Overview
2. Key findings
3. Current state
4. Notable trends
5. Recommendations`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class CreateIssueWorkflow implements Workflow {
  name = 'create-issue';
  description = 'Creates GitHub issue drafts';
  triggers = ['issue', 'bug', 'task'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const description = request.args.join(' ') || 'issue';
    
    const prompt = `Create a GitHub issue draft for:

Description: ${description}

Please provide:
1. Title
2. Description
3. Acceptance criteria
4. Labels
5. Priority`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class CreatePostWorkflow implements Workflow {
  name = 'create-post';
  description = 'Creates social media posts';
  triggers = ['post', 'tweet', 'announce'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const topic = request.args.join(' ') || 'topic';
    
    const prompt = `Create an engaging X/Twitter post about:

Topic: ${topic}

Please provide:
1. Post content (under 280 characters)
2. Hashtags
3. Best posting time
4. Engagement tips`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class CreateVideoBriefWorkflow implements Workflow {
  name = 'video-brief';
  description = 'Creates video briefs for ClipLoop';
  triggers = ['video', 'brief', 'clip'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const topic = request.args.join(' ') || 'topic';
    
    const prompt = `Create a video brief for ClipLoop about:

Topic: ${topic}

Please provide:
1. Video title
2. Script outline
3. Key points to cover
4. Visual suggestions
5. Call to action`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class WorkflowRegistry {
  private workflows: Map<string, Workflow> = new Map();

  register(workflow: Workflow): void {
    this.workflows.set(workflow.name, workflow);
  }

  get(name: string): Workflow | undefined {
    return this.workflows.get(name);
  }

  list(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getNames(): string[] {
    return Array.from(this.workflows.keys());
  }
}

export function createDefaultWorkflows(provider: Provider): WorkflowRegistry {
  const registry = new WorkflowRegistry();
  
  registry.register(new SummarizeWorkflow(provider));
  registry.register(new DraftReplyWorkflow(provider));
  registry.register(new LaunchPlanWorkflow(provider));
  registry.register(new ResearchWorkflow(provider));
  registry.register(new CreateIssueWorkflow(provider));
  registry.register(new CreatePostWorkflow(provider));
  registry.register(new CreateVideoBriefWorkflow(provider));
  
  return registry;
}
