import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), '.worklane');

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string): T[] {
  ensureDir();
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content) as T[];
}

function writeJson<T>(filename: string, data: T[]): void {
  ensureDir();
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const storage = {
  agents: {
    list: () => readJson<import('./types').Agent>('agents.json'),
    get: (id: string) => readJson<import('./types').Agent>('agents.json').find(a => a.id === id),
    create: (data: Omit<import('./types').Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
      const agents = readJson<import('./types').Agent>('agents.json');
      const now = new Date().toISOString();
      const agent: import('./types').Agent = { ...data, id: generateId('ag'), createdAt: now, updatedAt: now };
      agents.push(agent);
      writeJson('agents.json', agents);
      return agent;
    },
    update: (id: string, data: Partial<import('./types').Agent>) => {
      const agents = readJson<import('./types').Agent>('agents.json');
      const idx = agents.findIndex(a => a.id === id);
      if (idx === -1) return null;
      agents[idx] = { ...agents[idx], ...data, updatedAt: new Date().toISOString() };
      writeJson('agents.json', agents);
      return agents[idx];
    },
    delete: (id: string) => {
      const agents = readJson<import('./types').Agent>('agents.json');
      const filtered = agents.filter(a => a.id !== id);
      writeJson('agents.json', filtered);
      return filtered.length < agents.length;
    },
  },

  knowledge: {
    list: () => readJson<import('./types').KnowledgeDocument>('knowledge.json'),
    get: (id: string) => readJson<import('./types').KnowledgeDocument>('knowledge.json').find(k => k.id === id),
    create: (data: Omit<import('./types').KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
      const items = readJson<import('./types').KnowledgeDocument>('knowledge.json');
      const now = new Date().toISOString();
      const doc: import('./types').KnowledgeDocument = { ...data, id: generateId('kb'), createdAt: now, updatedAt: now };
      items.push(doc);
      writeJson('knowledge.json', items);
      return doc;
    },
    delete: (id: string) => {
      const items = readJson<import('./types').KnowledgeDocument>('knowledge.json');
      const filtered = items.filter(k => k.id !== id);
      writeJson('knowledge.json', filtered);
      return filtered.length < items.length;
    },
  },

  connections: {
    list: () => readJson<import('./types').Connection>('connections.json'),
    get: (id: string) => readJson<import('./types').Connection>('connections.json').find(c => c.id === id),
    create: (data: Omit<import('./types').Connection, 'id' | 'createdAt' | 'updatedAt' | 'secretRef'>) => {
      const conns = readJson<import('./types').Connection>('connections.json');
      const now = new Date().toISOString();
      const conn: import('./types').Connection = {
        ...data,
        id: generateId('conn'),
        secretRef: generateId('ref'),
        createdAt: now,
        updatedAt: now,
      };
      conns.push(conn);
      writeJson('connections.json', conns);
      return conn;
    },
    delete: (id: string) => {
      const conns = readJson<import('./types').Connection>('connections.json');
      const filtered = conns.filter(c => c.id !== id);
      writeJson('connections.json', filtered);
      return filtered.length < conns.length;
    },
  },

  runs: {
    list: () => readJson<import('./types').TaskRun>('runs.json'),
    get: (id: string) => readJson<import('./types').TaskRun>('runs.json').find(r => r.id === id),
    create: (data: Omit<import('./types').TaskRun, 'id' | 'createdAt' | 'updatedAt'>) => {
      const runs = readJson<import('./types').TaskRun>('runs.json');
      const now = new Date().toISOString();
      const run: import('./types').TaskRun = { ...data, id: generateId('run'), createdAt: now, updatedAt: now };
      runs.push(run);
      writeJson('runs.json', runs);
      return run;
    },
    update: (id: string, data: Partial<import('./types').TaskRun>) => {
      const runs = readJson<import('./types').TaskRun>('runs.json');
      const idx = runs.findIndex(r => r.id === id);
      if (idx === -1) return null;
      runs[idx] = { ...runs[idx], ...data, updatedAt: new Date().toISOString() };
      writeJson('runs.json', runs);
      return runs[idx];
    },
  },

  approvals: {
    list: () => readJson<import('./types').ApprovalRequest>('approvals.json'),
    get: (id: string) => readJson<import('./types').ApprovalRequest>('approvals.json').find(a => a.id === id),
    create: (data: Omit<import('./types').ApprovalRequest, 'id' | 'createdAt'>) => {
      const approvals = readJson<import('./types').ApprovalRequest>('approvals.json');
      const req: import('./types').ApprovalRequest = { ...data, id: generateId('apr'), createdAt: new Date().toISOString() };
      approvals.push(req);
      writeJson('approvals.json', approvals);
      return req;
    },
    update: (id: string, data: Partial<import('./types').ApprovalRequest>) => {
      const approvals = readJson<import('./types').ApprovalRequest>('approvals.json');
      const idx = approvals.findIndex(a => a.id === id);
      if (idx === -1) return null;
      approvals[idx] = { ...approvals[idx], ...data };
      writeJson('approvals.json', approvals);
      return approvals[idx];
    },
  },

  audit: {
    list: (filters?: { actorType?: string; action?: string; limit?: number }) => {
      let events = readJson<import('./types').AuditEvent>('audit.json');
      if (filters?.actorType) events = events.filter(e => e.actorType === filters.actorType);
      if (filters?.action) events = events.filter(e => e.action.includes(filters.action!));
      if (filters?.limit) events = events.slice(-filters.limit);
      return events;
    },
    create: (data: Omit<import('./types').AuditEvent, 'id' | 'timestamp'>) => {
      const events = readJson<import('./types').AuditEvent>('audit.json');
      const event: import('./types').AuditEvent = {
        ...data,
        id: generateId('evt'),
        timestamp: new Date().toISOString(),
      };
      events.push(event);
      writeJson('audit.json', events);
      return event;
    },
  },

  triggers: {
    list: () => readJson<import('./types').Trigger>('triggers.json'),
    get: (id: string) => readJson<import('./types').Trigger>('triggers.json').find(t => t.id === id),
    create: (data: Omit<import('./types').Trigger, 'id' | 'createdAt' | 'updatedAt'>) => {
      const triggers = readJson<import('./types').Trigger>('triggers.json');
      const now = new Date().toISOString();
      const trigger: import('./types').Trigger = { ...data, id: generateId('trg'), createdAt: now, updatedAt: now };
      triggers.push(trigger);
      writeJson('triggers.json', triggers);
      return trigger;
    },
    delete: (id: string) => {
      const triggers = readJson<import('./types').Trigger>('triggers.json');
      const filtered = triggers.filter(t => t.id !== id);
      writeJson('triggers.json', filtered);
      return filtered.length < triggers.length;
    },
  },
};
