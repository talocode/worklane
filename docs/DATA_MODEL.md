# Data Model

## Entities

### Workspace
```typescript
interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### Member
```typescript
interface Member {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
}
```

### Agent
```typescript
interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  skills: string[];
  systemPrompt?: string;
  model?: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  updatedAt: string;
}
```

### KnowledgeDocument
```typescript
interface KnowledgeDocument {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Connection
```typescript
interface Connection {
  id: string;
  workspaceId: string;
  name: string;
  type: string; // 'github' | 'slack' | 'email' | 'custom'
  status: 'active' | 'inactive' | 'error';
  secretRef: string; // reference ID, never plaintext
  config: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### TaskRun
```typescript
interface TaskRun {
  id: string;
  workspaceId: string;
  agentId: string;
  task: string;
  status: 'pending_approval' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';
  executionMode: 'simulated' | 'live';
  riskLevel: 'low' | 'medium' | 'high';
  plan: TaskStep[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  result?: string;
  error?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### TaskStep
```typescript
interface TaskStep {
  id: string;
  runId: string;
  order: number;
  description: string;
  tool?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: string;
  error?: string;
}
```

### ApprovalRequest
```typescript
interface ApprovalRequest {
  id: string;
  runId: string;
  workspaceId: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiredPermissions: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
  notes?: string;
}
```

### Trigger
```typescript
interface Trigger {
  id: string;
  workspaceId: string;
  name: string;
  type: 'manual' | 'schedule' | 'event';
  agentId: string;
  task: string;
  schedule?: string; // cron expression for schedule type
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### AuditEvent
```typescript
interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  actorType: 'user' | 'agent' | 'system';
  action: string;
  target: string;
  targetType: string;
  result: 'success' | 'failure' | 'pending';
  metadata?: Record<string, unknown>;
  timestamp: string;
}
```

### SecretReference
```typescript
interface SecretReference {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  reference: string; // encrypted or vault reference
  createdAt: string;
}
```

### ToolActionDefinition
```typescript
interface ToolActionDefinition {
  id: string;                    // e.g. "github.create_issue"
  provider: 'github';
  type: string;                  // e.g. "github.create_issue"
  name: string;                  // e.g. "Create GitHub Issue"
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: true;
  requiredConnectionType: string;
  inputSchema: Record<string, unknown>;
}
```

### TaskRun (with tool action)
```typescript
// TaskRun now includes optional tool action fields:
interface TaskRun {
  // ... existing fields ...
  toolAction?: string;               // e.g. "github.create_issue"
  toolInput?: Record<string, unknown>; // action-specific input
  executionMode: 'simulated' | 'live';
}
```

### TaskStep (with tool action)
```typescript
// TaskStep now includes optional tool action fields:
interface TaskStep {
  // ... existing fields ...
  toolAction?: string;
  toolInput?: Record<string, unknown>;
}
```
