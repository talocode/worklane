import { Request, Response, Agent, Workflow } from './types.js';

export class Router {
  private agents: Map<string, Agent> = new Map();
  private workflows: Map<string, Workflow> = new Map();

  registerAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
  }

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.name, workflow);
  }

  async route(request: Request): Promise<Response> {
    const { command } = request;

    const workflow = this.findWorkflow(command);
    if (workflow) {
      return workflow.execute(request);
    }

    const agent = this.findAgent(command);
    if (agent) {
      return agent.execute(request);
    }

    return {
      requestId: request.id,
      success: false,
      error: `No handler found for command: ${command}`,
    };
  }

  private findWorkflow(command: string): Workflow | undefined {
    for (const workflow of this.workflows.values()) {
      if (workflow.triggers.some(trigger => command.toLowerCase().includes(trigger.toLowerCase()))) {
        return workflow;
      }
    }
    return undefined;
  }

  private findAgent(command: string): Agent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.capabilities.some(cap => command.toLowerCase().includes(cap.toLowerCase()))) {
        return agent;
      }
    }
    return undefined;
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}
