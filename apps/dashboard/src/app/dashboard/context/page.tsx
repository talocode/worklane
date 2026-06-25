'use client';

import { useEffect, useState } from 'react';

interface ContextProvider {
  id: string;
  product: string;
  title: string;
  description: string;
  provides: string[];
  privacyLevel: string;
}

export default function ContextPage() {
  const [providers, setProviders] = useState<ContextProvider[]>([]);

  useEffect(() => {
    fetch('/api/agent-protocol/context').then(r => r.json()).then(d => setProviders(d.contextProviders || []));
  }, []);

  const privacyColor = (level: string) => {
    if (level === 'public') return '#4ade80';
    if (level === 'workspace') return '#60a5fa';
    if (level === 'private') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Context Providers</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>App state available to agents. Each provider declares its privacy level.</p>

      {providers.map(p => (
        <div key={p.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.description}</div>
            </div>
            <span style={{ ...badge, background: privacyColor(p.privacyLevel) + '22', color: privacyColor(p.privacyLevel) }}>
              {p.privacyLevel.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
            Provides: {p.provides.join(', ')}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, fontFamily: 'monospace' }}>
            ID: {p.id} · Product: {p.product}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 24, padding: 12, background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, fontSize: 12, color: '#888' }}>
        Sensitive context providers require explicit access grants. Public providers are available to all agents.
      </div>
    </div>
  );
}

const card: React.CSSProperties = { padding: '16px 20px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 12 };
const badge: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 };
