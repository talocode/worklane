import { Router } from '../router';
import { Request, Agent, Workflow } from '../types';

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  it('should route to workflow when trigger matches', async () => {
    const mockWorkflow: Workflow = {
      name: 'summarize',
      description: 'Summarize text',
      triggers: ['summarize'],
      execute: jest.fn().mockResolvedValue({
        requestId: 'test-id',
        success: true,
        data: 'Summary result',
      }),
    };

    router.registerWorkflow(mockWorkflow);

    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'summarize',
      args: ['this', 'text'],
      timestamp: new Date(),
      source: 'cli',
    };

    const response = await router.route(request);

    expect(response.success).toBe(true);
    expect(response.data).toBe('Summary result');
    expect(mockWorkflow.execute).toHaveBeenCalledWith(request);
  });

  it('should route to agent when capability matches', async () => {
    const mockAgent: Agent = {
      name: 'research',
      description: 'Research agent',
      capabilities: ['research'],
      execute: jest.fn().mockResolvedValue({
        requestId: 'test-id',
        success: true,
        data: 'Research result',
      }),
    };

    router.registerAgent(mockAgent);

    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'research',
      args: ['topic'],
      timestamp: new Date(),
      source: 'cli',
    };

    const response = await router.route(request);

    expect(response.success).toBe(true);
    expect(response.data).toBe('Research result');
    expect(mockAgent.execute).toHaveBeenCalledWith(request);
  });

  it('should return error when no handler found', async () => {
    const request: Request = {
      id: 'test-id',
      userId: 'user-1',
      command: 'unknown',
      args: [],
      timestamp: new Date(),
      source: 'cli',
    };

    const response = await router.route(request);

    expect(response.success).toBe(false);
    expect(response.error).toContain('No handler found');
  });

  it('should list registered agents', () => {
    const mockAgent: Agent = {
      name: 'test-agent',
      description: 'Test agent',
      capabilities: ['test'],
      execute: jest.fn(),
    };

    router.registerAgent(mockAgent);

    const agents = router.getAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('test-agent');
  });

  it('should list registered workflows', () => {
    const mockWorkflow: Workflow = {
      name: 'test-workflow',
      description: 'Test workflow',
      triggers: ['test'],
      execute: jest.fn(),
    };

    router.registerWorkflow(mockWorkflow);

    const workflows = router.getWorkflows();
    expect(workflows).toHaveLength(1);
    expect(workflows[0].name).toBe('test-workflow');
  });
});
