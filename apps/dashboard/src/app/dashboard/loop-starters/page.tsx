'use client';

import { useEffect, useState } from 'react';

interface Starter {
  id: string;
  name: string;
  description: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  suggestedCadence: string;
  defaultMode: 'report_only' | 'approval_required';
  requiredTools: string[];
  permissionProfile: string;
}

interface InstantiateResult {
  routineDraft: Record<string, unknown>;
  permissionProfile: string;
  approvalRequired: boolean;
  requiredTools: string[];
  verificationChecklist: string[];
  warnings: string[];
}

const riskColors: Record<Starter['risk'], string> = {
  low: '#4ade80',
  medium: '#fbbf24',
  high: '#f87171',
};

export default function LoopStartersPage() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [repo, setRepo] = useState('');
  const [cadence, setCadence] = useState('');
  const [mode, setMode] = useState<'report_only' | 'approval_required'>('report_only');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<InstantiateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/loop-starters')
      .then((response) => response.json())
      .then((data) => setStarters(data.starters || []));
  }, []);

  const selectStarter = (starter: Starter) => {
    setSelectedId(starter.id);
    setTitle(`${starter.name} — Draft`);
    setCadence(starter.suggestedCadence);
    setMode(starter.defaultMode);
    setPreview(null);
    setError(null);
  };

  const instantiate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/loop-starters/${selectedId}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, repo, cadence, mode, notes }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || 'Failed to instantiate starter');
        setPreview(null);
        return;
      }
      setPreview({
        routineDraft: data.routineDraft,
        permissionProfile: data.permissionProfile,
        approvalRequired: data.approvalRequired,
        requiredTools: data.requiredTools || [],
        verificationChecklist: data.verificationChecklist || [],
        warnings: data.warnings || [],
      });
    } catch {
      setError('Failed to instantiate starter');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Loop Starter Kits</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#93c5fd' }}>
        v0.1: reusable loop engineering patterns. Instantiation creates a routine draft only — no auto-run, no auto-push, no auto-deploy.
      </div>
      <p style={{ marginTop: 0, marginBottom: 20, fontSize: 13, color: '#94a3b8' }}>
        Start from a safe pattern, review the draft, then save it through{' '}
        <a href="/dashboard/automation" style={{ color: '#93c5fd' }}>Loops & Routines</a> when ready.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={panel}>
          <h2 style={heading}>Starter Kits</h2>
          {starters.map((starter) => (
            <div
              key={starter.id}
              style={{
                ...listItem,
                border: selectedId === starter.id ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: 6,
                padding: '12px 12px',
                marginBottom: 8,
                cursor: 'pointer',
              }}
              onClick={() => selectStarter(starter)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{starter.name}</div>
                <span style={{ ...badge, color: riskColors[starter.risk], borderColor: riskColors[starter.risk] }}>
                  {starter.risk} risk
                </span>
              </div>
              <div style={copy}>{starter.description}</div>
              <div style={copy}>
                {starter.category} · cadence {starter.suggestedCadence} · mode {starter.defaultMode}
              </div>
              <div style={copy}>Tools: {starter.requiredTools.join(', ')}</div>
              <div style={copy}>Permission profile: {starter.permissionProfile}</div>
            </div>
          ))}
        </section>

        <section style={panel}>
          <h2 style={heading}>Instantiate Draft</h2>
          {!selectedId && <p style={{ color: '#666' }}>Select a starter kit to configure a routine draft.</p>}
          {selectedId && (
            <>
              <label style={label}>Title</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} style={input} />
              <label style={label}>Repository</label>
              <input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repo" style={input} />
              <label style={label}>Cadence</label>
              <input value={cadence} onChange={(event) => setCadence(event.target.value)} style={input} />
              <label style={label}>Mode</label>
              <select value={mode} onChange={(event) => setMode(event.target.value as 'report_only' | 'approval_required')} style={input}>
                <option value="report_only">report_only</option>
                <option value="approval_required">approval_required</option>
              </select>
              <label style={label}>Notes</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...input, minHeight: 72 }} />
              <button onClick={instantiate} disabled={loading || !repo.trim()} style={{ ...buttonStyle, background: '#2563eb', marginTop: 12 }}>
                {loading ? 'Generating draft...' : 'Instantiate routine draft'}
              </button>
              {error && <div style={{ ...copy, color: '#f87171', marginTop: 12 }}>{error}</div>}
            </>
          )}
        </section>
      </div>

      {preview && (
        <section style={{ ...panel, marginTop: 24 }}>
          <h2 style={heading}>Routine Draft Preview</h2>
          <div style={{ ...copy, color: '#fbbf24', marginBottom: 12 }}>
            {preview.warnings.map((warning) => (
              <div key={warning}>⚠ {warning}</div>
            ))}
          </div>
          <div style={copy}>approvalRequired: {String(preview.approvalRequired)} · profile: {preview.permissionProfile}</div>
          <div style={copy}>Required tools: {preview.requiredTools.join(', ')}</div>
          <h3 style={{ fontSize: 14, marginTop: 16, marginBottom: 8 }}>Verification checklist</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#94a3b8', fontSize: 13 }}>
            {preview.verificationChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <pre style={previewBox}>{JSON.stringify(preview.routineDraft, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}

const panel: React.CSSProperties = { padding: '20px 24px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8 };
const listItem: React.CSSProperties = { padding: '12px 0', borderBottom: '1px solid #252535' };
const heading: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 };
const copy: React.CSSProperties = { fontSize: 13, color: '#94a3b8', marginTop: 4 };
const badge: React.CSSProperties = { fontSize: 11, padding: '2px 8px', border: '1px solid', borderRadius: 999 };
const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#94a3b8', marginTop: 10, marginBottom: 4 };
const input: React.CSSProperties = { width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #2a2a3a', borderRadius: 6, color: '#e2e8f0', fontSize: 13 };
const buttonStyle: React.CSSProperties = { padding: '8px 14px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const previewBox: React.CSSProperties = { marginTop: 16, padding: 16, background: '#0f172a', border: '1px solid #2a2a3a', borderRadius: 6, overflow: 'auto', fontSize: 12, color: '#cbd5e1' };