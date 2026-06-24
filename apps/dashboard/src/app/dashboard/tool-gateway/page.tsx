'use client';

import { useEffect, useState } from 'react';

export default function ToolGatewayPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/tool-gateway/sources').then((response) => response.json()),
      fetch('/api/tool-gateway/tools').then((response) => response.json()),
      fetch('/api/tool-gateway/calls').then((response) => response.json()),
    ]).then(([sourcesData, toolsData, callsData]) => {
      setSources(sourcesData.sources || []);
      setTools(toolsData.tools || []);
      setCalls(callsData.calls || []);
    });
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Tool Gateway</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#93c5fd' }}>
        v0.1: provider-agnostic registry with approval-first deterministic execution.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={panel}>
          <h2 style={heading}>Sources</h2>
          {sources.map((source) => (
            <div key={source.id} style={listItem}>
              <div style={{ fontWeight: 500 }}>{source.name}</div>
              <div style={copy}>{source.type} · {source.enabled ? 'enabled' : 'disabled'} · {source.configStatus}</div>
            </div>
          ))}
        </section>
        <section style={panel}>
          <h2 style={heading}>Tools</h2>
          {tools.map((tool) => (
            <div key={tool.id} style={listItem}>
              <div style={{ fontWeight: 500 }}>{tool.displayName}</div>
              <div style={copy}>{tool.riskLevel} · approval {tool.requiresApproval ? 'required' : 'not required'} · {tool.enabled ? 'enabled' : 'disabled'}</div>
            </div>
          ))}
        </section>
      </div>
      <section style={{ ...panel, marginTop: 24 }}>
        <h2 style={heading}>Recent Calls</h2>
        {calls.length === 0 && <p style={{ color: '#666' }}>No tool calls yet.</p>}
        {calls.slice().reverse().map((call) => (
          <div key={call.id} style={listItem}>
            <div style={{ fontWeight: 500 }}>{call.toolId}</div>
            <div style={copy}>{call.status} · approval {call.approvalRequired ? 'required' : 'not required'}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

const panel: React.CSSProperties = { padding: '20px 24px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8 };
const listItem: React.CSSProperties = { padding: '12px 0', borderBottom: '1px solid #252535' };
const heading: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 };
const copy: React.CSSProperties = { fontSize: 13, color: '#94a3b8', marginTop: 4 };
