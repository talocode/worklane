'use client';

import { useEffect, useState } from 'react';

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/audit?limit=50').then(r => r.json()).then(d => setEvents(d.events || []));
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Audit Log</h1>
      {events.length === 0 && <p style={{ color: '#666' }}>No audit events yet.</p>}
      {events.slice().reverse().map(e => (
        <div key={e.id} style={listItem}>
          <div style={{ fontSize: 14 }}>{e.action}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Actor: {e.actorType} ({e.actorId}) · Target: {e.targetType} ({e.target}) · Result: {e.result}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{new Date(e.timestamp).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

const listItem: React.CSSProperties = { padding: '12px 16px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 8 };
