'use client';

import { useEffect, useState } from 'react';

interface Stats {
  agents: number;
  knowledge: number;
  connections: number;
  pendingRuns: number;
  tools: number;
  automationRuns: number;
  executionItems: number;
  recentRuns: { id: string; task: string; status: string; createdAt: string }[];
  recentAudit: { id: string; action: string; actorType: string; timestamp: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/knowledge').then(r => r.json()),
      fetch('/api/connections').then(r => r.json()),
      fetch('/api/runs').then(r => r.json()),
      fetch('/api/tool-gateway/tools').then(r => r.json()),
      fetch('/api/automation/runs').then(r => r.json()),
      fetch('/api/execution/queue').then(r => r.json()),
      fetch('/api/audit?limit=5').then(r => r.json()),
    ]).then(([agents, knowledge, connections, runs, tools, automationRuns, execution, audit]) => {
      const pendingRuns = (runs.runs || []).filter((r: any) => r.status === 'pending_approval');
      setStats({
        agents: (agents.agents || []).length,
        knowledge: (knowledge.knowledge || []).length,
        connections: (connections.connections || []).length,
        pendingRuns: pendingRuns.length,
        tools: (tools.tools || []).length,
        automationRuns: (automationRuns.runs || []).length,
        executionItems: (execution.items || []).length,
        recentRuns: (runs.runs || []).slice(-5).reverse(),
        recentAudit: (audit.events || []).slice(-5).reverse(),
      });
    });
  }, []);

  if (!stats) return <div style={{ padding: 40, color: '#888' }}>Loading...</div>;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Agents', value: stats.agents, href: '/dashboard/agents' },
          { label: 'Knowledge', value: stats.knowledge, href: '/dashboard/knowledge' },
          { label: 'Connections', value: stats.connections, href: '/dashboard/connections' },
          { label: 'Pending Approvals', value: stats.pendingRuns, href: '/dashboard/runs' },
          { label: 'Tools', value: stats.tools, href: '/dashboard/tool-gateway' },
          { label: 'Automation Runs', value: stats.automationRuns, href: '/dashboard/automation' },
          { label: 'Loop Starters', value: 7, href: '/dashboard/loop-starters' },
          { label: 'Execution Items', value: stats.executionItems, href: '/dashboard/execution' },
        ].map(s => (
          <a key={s.label} href={s.href} style={{ ...statCard, textDecoration: 'none' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
          </a>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Runs</h2>
          {stats.recentRuns.length === 0 && <p style={{ color: '#666', fontSize: 14 }}>No runs yet.</p>}
          {stats.recentRuns.map(r => (
            <div key={r.id} style={listItem}>
              <div style={{ fontSize: 14 }}>{r.task.slice(0, 60)}{r.task.length > 60 ? '...' : ''}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                <span style={{ color: r.status === 'completed' ? '#4ade80' : r.status === 'pending_approval' ? '#fbbf24' : '#888' }}>
                  {r.status}
                </span>
                {' · '}{new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Audit Log</h2>
          {stats.recentAudit.length === 0 && <p style={{ color: '#666', fontSize: 14 }}>No events yet.</p>}
          {stats.recentAudit.map(e => (
            <div key={e.id} style={listItem}>
              <div style={{ fontSize: 14 }}>{e.action}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {e.actorType} · {new Date(e.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const statCard: React.CSSProperties = {
  padding: '20px 24px',
  background: '#16161e',
  border: '1px solid #2a2a3a',
  borderRadius: 8,
};

const listItem: React.CSSProperties = {
  padding: '12px 16px',
  background: '#16161e',
  border: '1px solid #2a2a3a',
  borderRadius: 6,
  marginBottom: 8,
};
