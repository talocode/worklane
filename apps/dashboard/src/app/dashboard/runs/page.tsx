'use client';

import { useEffect, useState } from 'react';

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);

  const load = () => fetch('/api/runs').then(r => r.json()).then(d => setRuns(d.runs || d.data?.runs || []));
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await fetch(`/api/runs/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'Approved from dashboard' }) });
    load();
  };

  const cancel = async (id: string) => {
    await fetch(`/api/runs/${id}/cancel`, { method: 'POST' });
    load();
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Task Runs</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#fbbf24' }}>
        v0.1: All execution is simulated. No real tool execution.
      </div>
      {runs.length === 0 && <p style={{ color: '#666' }}>No runs yet. Create one from the Agents page.</p>}
      {runs.slice().reverse().map(r => (
        <div key={r.id} style={listItem}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{r.task}</div>
            <span style={{ ...badge, background: r.executionMode === 'simulated' ? '#7c3aed22' : '#22c55e22', color: r.executionMode === 'simulated' ? '#a78bfa' : '#4ade80' }}>
              {r.executionMode === 'simulated' ? 'SIMULATED' : 'LIVE'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Status: <span style={{ color: statusColor(r.status) }}>{r.status}</span>
            {' · '}Risk: {r.riskLevel}
            {' · '}{new Date(r.createdAt).toLocaleString()}
          </div>
          {r.status === 'pending_approval' && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={() => approve(r.id)} style={{ ...btn, background: '#22c55e' }}>Approve</button>
              <button onClick={() => cancel(r.id)} style={{ ...btn, background: '#ef4444' }}>Cancel</button>
            </div>
          )}
          {r.result && <div style={{ fontSize: 13, color: '#4ade80', marginTop: 8 }}>{r.result}</div>}
        </div>
      ))}
    </div>
  );
}

function statusColor(s: string) {
  if (s === 'completed') return '#4ade80';
  if (s === 'pending_approval') return '#fbbf24';
  if (s === 'running') return '#60a5fa';
  if (s === 'failed') return '#ef4444';
  if (s === 'cancelled') return '#888';
  return '#e0e0e0';
}

const listItem: React.CSSProperties = { padding: '16px 20px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 12 };
const btn: React.CSSProperties = { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const badge: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 };
