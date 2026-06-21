'use client';

import { useEffect, useState } from 'react';

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [task, setTask] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [issueLabels, setIssueLabels] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    fetch('/api/runs').then(r => r.json()).then(d => setRuns(d.runs || d.data?.runs || []));
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || d.data?.agents || []));
  };
  useEffect(() => { load(); }, []);

  const createIssueRun = async () => {
    if (!selectedAgent || !owner || !repo || !issueTitle) {
      setMessage('Agent, owner, repo, and title are required');
      return;
    }

    const res = await fetch(`/api/agents/${selectedAgent}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: `Create GitHub issue: ${issueTitle}`,
        toolAction: 'github.create_issue',
        toolInput: {
          owner,
          repo,
          title: issueTitle,
          body: issueBody || undefined,
          labels: issueLabels ? issueLabels.split(',').map(l => l.trim()).filter(Boolean) : undefined,
        },
        executionMode: 'live',
      }),
    });
    const data = await res.json();
    setMessage(`Run created: ${data.run?.id} — approval required before execution`);
    setIssueTitle(''); setIssueBody(''); setIssueLabels('');
    load();
  };

  const approve = async (id: string) => {
    await fetch(`/api/runs/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'Approved from dashboard' }) });
    setMessage('Run approved. Click Execute to run the tool action.');
    load();
  };

  const execute = async (id: string) => {
    setMessage('Executing...');
    const res = await fetch(`/api/runs/${id}/execute`, { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      setMessage(`Execution complete: ${data.execution?.mode === 'real' ? 'Real' : 'Simulated'}`);
    } else {
      setMessage(`Execution failed: ${data.error}`);
    }
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
        GitHub issue creation requires approval before execution. Token is read from WORKLANE_GITHUB_TOKEN env.
      </div>

      {message && <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #3b82f6', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#60a5fa' }}>{message}</div>}

      <div style={{ padding: 20, background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Create GitHub Issue Run</h2>
        <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} style={input}>
          <option value="">Select agent...</option>
          {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Owner (e.g. talocode)" value={owner} onChange={e => setOwner(e.target.value)} style={input} />
          <input placeholder="Repo (e.g. worklane)" value={repo} onChange={e => setRepo(e.target.value)} style={input} />
        </div>
        <input placeholder="Issue title" value={issueTitle} onChange={e => setIssueTitle(e.target.value)} style={input} />
        <textarea placeholder="Issue body (optional)" value={issueBody} onChange={e => setIssueBody(e.target.value)} style={{ ...input, minHeight: 60 }} />
        <input placeholder="Labels (comma-separated, optional)" value={issueLabels} onChange={e => setIssueLabels(e.target.value)} style={input} />
        <button onClick={createIssueRun} style={btn}>Create Issue Run</button>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>This will create a run that requires approval before any GitHub issue is created.</div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Runs ({runs.length})</h2>
      {runs.length === 0 && <p style={{ color: '#666' }}>No runs yet.</p>}
      {runs.slice().reverse().map(r => (
        <div key={r.id} style={listItem}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{r.task}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ ...badge, background: r.executionMode === 'simulated' ? '#7c3aed22' : '#22c55e22', color: r.executionMode === 'simulated' ? '#a78bfa' : '#4ade80' }}>
                {r.executionMode === 'simulated' ? 'SIMULATED' : 'REAL'}
              </span>
              {r.toolAction && <span style={{ ...badge, background: '#3b82f622', color: '#60a5fa' }}>{r.toolAction}</span>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Status: <span style={{ color: statusColor(r.status) }}>{r.status}</span>
            {' · '}Risk: {r.riskLevel}
            {' · '}{new Date(r.createdAt).toLocaleString()}
          </div>
          {r.toolInput && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontFamily: 'monospace' }}>
              {r.toolInput.owner}/{r.toolInput.repo} — {r.toolInput.title}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {r.status === 'pending_approval' && (
              <button onClick={() => approve(r.id)} style={{ ...btn, background: '#22c55e', fontSize: 12, padding: '4px 10px' }}>Approve</button>
            )}
            {r.status === 'approved' && (
              <button onClick={() => execute(r.id)} style={{ ...btn, background: '#3b82f6', fontSize: 12, padding: '4px 10px' }}>Execute</button>
            )}
            {(r.status === 'pending_approval' || r.status === 'approved') && (
              <button onClick={() => cancel(r.id)} style={{ ...btn, background: '#ef4444', fontSize: 12, padding: '4px 10px' }}>Cancel</button>
            )}
          </div>
          {r.result && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 6, fontFamily: 'monospace' }}>{r.result}</div>}
          {r.error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{r.error}</div>}
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

const input: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 8, background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 6, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const listItem: React.CSSProperties = { padding: '16px 20px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 12 };
const badge: React.CSSProperties = { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 };
