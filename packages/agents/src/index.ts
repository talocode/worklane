import { Agent, Request, Response, Provider } from '@talocode/worklane-core';

export class ManagerAgent implements Agent {
  name = 'manager';
  description = 'Routes tasks to appropriate agents and coordinates work';
  capabilities = ['manage', 'route', 'coordinate', 'assign'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const prompt = `You are a manager agent. Analyze this request and determine the best agent to handle it:
    
Request: ${request.command} ${request.args.join(' ')}

Available agents:
- research: For research tasks
- writer: For writing tasks
- engineer: For technical planning
- qa: For quality assurance
- support: For support tasks
- marketing: For marketing tasks

Respond with the agent name and a brief explanation.`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: {
        routedTo: result,
        originalRequest: request,
      },
    };
  }
}

export class ResearchAgent implements Agent {
  name = 'research';
  description = 'Conducts research on topics and provides findings';
  capabilities = ['research', 'investigate', 'analyze', 'study'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const topic = request.args.join(' ') || 'general topic';
    
    const prompt = `Conduct research on the following topic and provide a comprehensive summary:

Topic: ${topic}

Please provide:
1. Key findings
2. Current state
3. Notable trends
4. Recommendations`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class WriterAgent implements Agent {
  name = 'writer';
  description = 'Creates written content including replies, posts, and documents';
  capabilities = ['write', 'draft', 'compose', 'create'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const task = request.args.join(' ') || 'general content';
    
    const prompt = `Create high-quality written content for the following task:

Task: ${task}

Please provide:
1. Main content
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

export class EngineerAgent implements Agent {
  name = 'engineer';
  description = 'Plans technical implementation and architecture';
  capabilities = ['plan', 'architect', 'design', 'implement'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const project = request.args.join(' ') || 'project';
    
    const prompt = `Create a technical implementation plan for:

Project: ${project}

Please provide:
1. Architecture overview
2. Key components
3. Implementation steps
4. Technical considerations
5. Potential challenges`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class QAAgent implements Agent {
  name = 'qa';
  description = 'Reviews work for quality, completeness, and correctness';
  capabilities = ['review', 'test', 'validate', 'check'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const content = request.args.join(' ') || 'content to review';
    
    const prompt = `Review the following content for quality and completeness:

Content: ${content}

Please provide:
1. Quality assessment
2. Issues found
3. Suggestions for improvement
4. Overall recommendation`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class SupportAgent implements Agent {
  name = 'support';
  description = 'Handles support requests and troubleshooting';
  capabilities = ['help', 'support', 'troubleshoot', 'fix'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const issue = request.args.join(' ') || 'support request';
    
    const prompt = `Handle the following support request:

Issue: ${issue}

Please provide:
1. Analysis of the issue
2. Proposed solution
3. Steps to resolve
4. Prevention tips`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class MarketingAgent implements Agent {
  name = 'marketing';
  description = 'Creates marketing content and strategies';
  capabilities = ['marketing', 'promote', 'launch', 'announce'];

  constructor(private provider: Provider) {}

  async execute(request: Request): Promise<Response> {
    const product = request.args.join(' ') || 'product';
    
    const prompt = `Create marketing content for:

Product: ${product}

Please provide:
1. Key messages
2. Target audience
3. Marketing channels
4. Content suggestions
5. Launch strategy`;

    const result = await this.provider.complete(prompt);

    return {
      requestId: request.id,
      success: true,
      data: result,
    };
  }
}

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  register(agent: Agent): void {
    this.agents.set(agent.name, agent);
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  list(): Agent[] {
    return Array.from(this.agents.values());
  }

  getNames(): string[] {
    return Array.from(this.agents.keys());
  }
}

export function createDefaultRegistry(provider: Provider): AgentRegistry {
  const registry = new AgentRegistry();
  
  registry.register(new ManagerAgent(provider));
  registry.register(new ResearchAgent(provider));
  registry.register(new WriterAgent(provider));
  registry.register(new EngineerAgent(provider));
  registry.register(new QAAgent(provider));
  registry.register(new SupportAgent(provider));
  registry.register(new MarketingAgent(provider));
  
  return registry;
}
