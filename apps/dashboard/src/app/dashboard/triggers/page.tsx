'use client';

import { useEffect, useState } from 'react';

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/triggers').then(r => r.json()).then(d => setTriggers(d.triggers || d.data?.triggers || []));
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Triggers</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#fbbf24' }}>
        v0.1: Only manual triggers are supported. Schedule and event triggers are planned for v0.3.
      </div>
      {triggers.length === 0 && <p style={{ color: '#666' }}>No triggers yet.</p>}
      {triggers.map(t => (
        <div key={t.id} style={listItem}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{t.name}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Type: {t.type} · Agent: {t.agentId} · Enabled: {t.enabled ? 'Yes' : 'No'}
          </div>
          {t.schedule && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Schedule: {t.schedule}</div>}
        </div>
      ))}
    </div>
  );
}

const listItem: React.CSSProperties = { padding: '12px 16px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 8 };
