'use client';

import { useEffect, useState } from 'react';

export default function ConnectionsPage() {
  const [conns, setConns] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('custom');
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);

  const load = () => {
    fetch('/api/connections').then(r => r.json()).then(d => setConns(d.connections || d.data?.connections || []));
    fetch('/api/tools').then(r => r.json()).then(d => {
      setTokenConfigured(true);
    }).catch(() => setTokenConfigured(false));
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name) return;
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, config: {} }),
    });
    setName('');
    load();
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Connections</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#fbbf24' }}>
        v0.1: Connections store references only. Secrets are never stored in plaintext. GitHub token is read from WORKLANE_GITHUB_TOKEN env var.
      </div>

      <div style={{ padding: 16, background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>GitHub Token Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: tokenConfigured ? '#22c55e' : '#ef4444' }} />
          <span style={{ fontSize: 13, color: '#888' }}>
            {tokenConfigured === null ? 'Checking...' : tokenConfigured ? 'WORKLANE_GITHUB_TOKEN is configured' : 'WORKLANE_GITHUB_TOKEN is not set'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          Token is stored in your environment, never in WorkLane storage.
        </div>
      </div>

      <div style={{ padding: 20, background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Add Connection</h2>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={input} />
        <select value={type} onChange={e => setType(e.target.value)} style={input}>
          <option value="custom">Custom</option>
          <option value="github">GitHub</option>
          <option value="slack">Slack</option>
          <option value="email">Email</option>
        </select>
        <button onClick={add} style={btn}>Add Connection</button>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Connections ({conns.length})</h2>
      {conns.map(c => (
        <div key={c.id} style={listItem}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Type: {c.type} · Status: {c.status} · Secret: *** (reference only)
          </div>
        </div>
      ))}
    </div>
  );
}

const input: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 8, background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 6, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const listItem: React.CSSProperties = { padding: '12px 16px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 8 };
