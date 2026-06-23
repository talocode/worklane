'use client';

import { useEffect, useState } from 'react';

interface ProtocolRun {
  id: string;
  actionId: string;
  lifecycle: string;
  approvalRequired: boolean;
  readOnly: boolean;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [runs, setRuns] = useState<ProtocolRun[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/agent-protocol/runs').then(r => r.json()).then(d => setRuns(d.runs || []));
    fetch('/api/agent-protocol/actions').then(r => r.json()).then(d => setActions(d.actions || []));
  }, []);

  const pendingRuns = runs.filter(r => r.lifecycle === 'pending_approval');
  const approvedRuns = runs.filter(r => r.lifecycle === 'approved');

  const approve = async (id: string) => {
    await fetch(`/api/agent-protocol/runs/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    load();
  };

  const execute = async (id: string) => {
    await fetch(`/api/agent-protocol/runs/${id}/execute`, { method: 'POST' });
    load();
  };

  const load = () => {
    fetch('/api/agent-protocol/runs').then(r => r.json()).then(d => setRuns(d.runs || []));
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Approvals</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>Review and approve agent action requests before execution.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Pending Approval ({pendingRuns.length})</h2>
      {pendingRuns.length === 0 && <p style={{ color: '#666', marginBottom: 24 }}>No pending approvals.</p>}
      {pendingRuns.map(r => {
        const action = actions.find(a => a.id === r.actionId);
        return (
          <div key={r.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{action?.title || r.actionId}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{action?.description}</div>
              </div>
              <span style={{ ...badge, background: '#fbbf2422', color: '#fbbf24' }}>PENDING</span>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Risk: {action?.riskLevel || 'unknown'} · Permissions: {action?.requiredPermissions?.join(', ') || 'none'}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4, fontFamily: 'monospace' }}>
              Input: {JSON.stringify(r.input).slice(0, 120)}...
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button onClick={() => approve(r.id)} style={{ ...btn, background: '#22c55e' }}>Approve</button>
              <button onClick={() => execute(r.id)} style={{ ...btn, background: '#3b82f6' }}>Execute</button>
            </div>
          </div>
        );
      })}

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24 }}>Approved ({approvedRuns.length})</h2>
      {approvedRuns.map(r => (
        <div key={r.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{r.actionId}</div>
            <span style={{ ...badge, background: '#22c55e22', color: '#4ade80' }}>APPROVED</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => execute(r.id)} style={{ ...btn, background: '#3b82f6' }}>Execute</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = { padding: '16px 20px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 12 };
const badge: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 };
const btn: React.CSSProperties = { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
