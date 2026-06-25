'use client';

import { useEffect, useState } from 'react';

export default function ExecutionPage() {
  const [items, setItems] = useState<any[]>([]);

  const load = () => {
    fetch('/api/execution/queue').then((response) => response.json()).then((data) => setItems(data.items || []));
  };

  useEffect(() => { load(); }, []);

  const runItem = async (id: string) => {
    await fetch(`/api/execution/queue/${id}/run`, { method: 'POST' });
    load();
  };

  const markManual = async (id: string) => {
    await fetch(`/api/execution/queue/${id}/manual`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Manual review required from dashboard.' }) });
    load();
  };

  const cancelItem = async (id: string) => {
    await fetch(`/api/execution/queue/${id}/cancel`, { method: 'POST' });
    load();
  };

  const grouped = {
    queued: items.filter((item) => item.status === 'queued'),
    ready: items.filter((item) => item.status === 'ready'),
    blocked: items.filter((item) => item.status === 'blocked'),
    manual: items.filter((item) => item.status === 'manual_required'),
    done: items.filter((item) => ['succeeded', 'failed', 'cancelled'].includes(item.status)),
  };

  const renderItem = (item: any) => (
    <div key={item.id} style={listItem}>
      <div style={{ fontWeight: 500 }}>{item.toolName}</div>
      <div style={copy}>{item.sourceName} · {item.riskLevel} · {item.status}</div>
      <div style={copy}>Automation run: {item.automationRunId || '(none)'} · approval {item.approvalRequired ? 'required' : 'not required'}</div>
      <div style={copy}>Queued: {new Date(item.queuedAt).toLocaleString()} {item.approvedAt ? `· approved ${new Date(item.approvedAt).toLocaleString()}` : ''}</div>
      {(item.loopId || item.routineId) && <div style={copy}>Context: {item.loopId ? `loop ${item.loopId}` : ''}{item.loopId && item.routineId ? ' · ' : ''}{item.routineId ? `routine ${item.routineId}` : ''}</div>}
      {item.warnings?.map((warning: string) => <div key={warning} style={{ ...copy, color: '#fbbf24' }}>{warning}</div>)}
      {item.result && <div style={copy}>Result: {JSON.stringify(item.result)}</div>}
      {item.error && <div style={{ ...copy, color: '#fca5a5' }}>Error: {item.error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {item.status === 'ready' && <button onClick={() => runItem(item.id)} style={{ ...buttonStyle, background: '#16a34a' }}>Run</button>}
        {item.status !== 'manual_required' && item.status !== 'succeeded' && item.status !== 'cancelled' && <button onClick={() => markManual(item.id)} style={{ ...buttonStyle, background: '#2563eb' }}>Mark Manual</button>}
        {['queued', 'ready', 'blocked', 'manual_required'].includes(item.status) && <button onClick={() => cancelItem(item.id)} style={{ ...buttonStyle, background: '#dc2626' }}>Cancel</button>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Execution Queue</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#93c5fd' }}>
        v0.1: approved Tool Gateway calls become reviewable queue items. Safe placeholder reads can run. Risky or unsupported work stays blocked or manual.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={panel}><h2 style={heading}>Ready</h2>{grouped.ready.map(renderItem)}{grouped.ready.length === 0 && <p style={{ color: '#666' }}>No ready items.</p>}</section>
        <section style={panel}><h2 style={heading}>Queued / Blocked</h2>{[...grouped.queued, ...grouped.blocked].map(renderItem)}{grouped.queued.length + grouped.blocked.length === 0 && <p style={{ color: '#666' }}>No queued or blocked items.</p>}</section>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <section style={panel}><h2 style={heading}>Manual Required</h2>{grouped.manual.map(renderItem)}{grouped.manual.length === 0 && <p style={{ color: '#666' }}>No manual items.</p>}</section>
        <section style={panel}><h2 style={heading}>Recent Results</h2>{grouped.done.map(renderItem)}{grouped.done.length === 0 && <p style={{ color: '#666' }}>No completed queue items.</p>}</section>
      </div>
    </div>
  );
}

const panel: React.CSSProperties = { padding: '20px 24px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8 };
const listItem: React.CSSProperties = { padding: '12px 0', borderBottom: '1px solid #252535' };
const heading: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 };
const copy: React.CSSProperties = { fontSize: 13, color: '#94a3b8', marginTop: 4 };
const buttonStyle: React.CSSProperties = { padding: '6px 12px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
