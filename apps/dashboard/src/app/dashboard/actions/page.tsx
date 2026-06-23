'use client';

import { useEffect, useState } from 'react';

interface ActionDef {
  id: string;
  type: string;
  title: string;
  description: string;
  riskLevel: string;
  readOnly: boolean;
  requiresApproval: boolean;
  requiredPermissions: string[];
}

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionDef[]>([]);

  useEffect(() => {
    fetch('/api/agent-protocol/actions').then(r => r.json()).then(d => setActions(d.actions || []));
  }, []);

  const riskColor = (level: string) => {
    if (level === 'read') return '#4ade80';
    if (level === 'low') return '#86efac';
    if (level === 'medium') return '#fbbf24';
    if (level === 'high') return '#f87171';
    return '#888';
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Action Catalog</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>Available agent actions in the Talocode Agent-Native Protocol.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ ...statBadge, background: '#4ade8022', color: '#4ade80' }}>
          Read-only: {actions.filter(a => a.readOnly).length}
        </span>
        <span style={{ ...statBadge, background: '#fbbf2422', color: '#fbbf24' }}>
          Write: {actions.filter(a => !a.readOnly).length}
        </span>
      </div>

      {actions.map(a => (
        <div key={a.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{a.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ ...badge, background: riskColor(a.riskLevel) + '22', color: riskColor(a.riskLevel) }}>
                {a.riskLevel.toUpperCase()}
              </span>
              <span style={{ ...badge, background: a.readOnly ? '#4ade8022' : '#fbbf2422', color: a.readOnly ? '#4ade80' : '#fbbf24' }}>
                {a.readOnly ? 'READ' : 'WRITE'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
            Permissions: {a.requiredPermissions.join(', ') || 'none'}
            {' · '}Approval: {a.requiresApproval ? 'required' : 'not required'}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4, fontFamily: 'monospace' }}>
            ID: {a.id}
          </div>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = { padding: '16px 20px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 12 };
const badge: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 };
const statBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500 };
