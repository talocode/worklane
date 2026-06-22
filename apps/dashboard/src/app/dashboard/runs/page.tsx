'use client';

import { useEffect, useState } from 'react';

type GitHubAction = 'github.create_issue' | 'github.create_comment' | 'github.list_issues' | 'github.get_issue' | 'github.list_issue_comments';

const READ_ONLY_ACTIONS: GitHubAction[] = ['github.list_issues', 'github.get_issue', 'github.list_issue_comments'];

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [action, setAction] = useState<GitHubAction>('github.create_issue');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [issueLabels, setIssueLabels] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [listState, setListState] = useState('open');
  const [listLabels, setListLabels] = useState('');
  const [listLimit, setListLimit] = useState('20');
  const [message, setMessage] = useState('');

  const isReadOnly = READ_ONLY_ACTIONS.includes(action);

  const load = () => {
    fetch('/api/runs').then(r => r.json()).then(d => setRuns(d.runs || d.data?.runs || []));
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || d.data?.agents || []));
  };
  useEffect(() => { load(); }, []);

  const createRun = async () => {
    if (!selectedAgent || !owner || !repo) {
      setMessage('Agent, owner, and repo are required');
      return;
    }

    let toolInput: Record<string, unknown> = {};
    let taskDescription = '';

    if (action === 'github.create_issue') {
      if (!issueTitle) { setMessage('Issue title is required'); return; }
      toolInput = { owner, repo, title: issueTitle, body: issueBody || undefined, labels: issueLabels ? issueLabels.split(',').map(l => l.trim()).filter(Boolean) : undefined };
      taskDescription = `Create GitHub issue: ${issueTitle}`;
    } else if (action === 'github.create_comment') {
      if (!issueNumber || !commentBody) { setMessage('Issue number and comment body are required'); return; }
      toolInput = { owner, repo, issueNumber: parseInt(issueNumber, 10), body: commentBody };
      taskDescription = `Comment on GitHub issue #${issueNumber}`;
    } else if (action === 'github.list_issues') {
      toolInput = { owner, repo, state: listState, labels: listLabels ? listLabels.split(',').map(l => l.trim()).filter(Boolean) : undefined, limit: parseInt(listLimit, 10) || 20 };
      taskDescription = `List GitHub issues in ${owner}/${repo}`;
    } else if (action === 'github.get_issue') {
      if (!issueNumber) { setMessage('Issue number is required'); return; }
      toolInput = { owner, repo, issueNumber: parseInt(issueNumber, 10) };
      taskDescription = `Get GitHub issue #${issueNumber} from ${owner}/${repo}`;
    } else if (action === 'github.list_issue_comments') {
      if (!issueNumber) { setMessage('Issue number is required'); return; }
      toolInput = { owner, repo, issueNumber: parseInt(issueNumber, 10), limit: parseInt(listLimit, 10) || 20 };
      taskDescription = `List comments on GitHub issue #${issueNumber}`;
    }

    const res = await fetch(`/api/agents/${selectedAgent}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskDescription, toolAction: action, toolInput, executionMode: 'live' }),
    });
    const data = await res.json();
    setMessage(isReadOnly
      ? `Read-only run created: ${data.run?.id} — no approval required`
      : `Run created: ${data.run?.id} — approval required before execution`);
    setIssueTitle(''); setIssueBody(''); setIssueLabels(''); setIssueNumber(''); setCommentBody('');
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
      const mode = data.execution?.mode === 'read' ? 'Read-only' : data.execution?.mode === 'real' ? 'Real' : 'Simulated';
      setMessage(`Execution complete (${mode})`);
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
        Write actions require approval before execution. Read-only actions run immediately. Token is read from WORKLANE_GITHUB_TOKEN env.
      </div>

      {message && <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #3b82f6', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#60a5fa' }}>{message}</div>}

      <div style={{ padding: 20, background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Create GitHub Action Run</h2>

        <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} style={input}>
          <option value="">Select agent...</option>
          {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(['github.create_issue', 'github.create_comment', 'github.list_issues', 'github.get_issue', 'github.list_issue_comments'] as GitHubAction[]).map(a => (
            <button key={a} onClick={() => setAction(a)} style={{ ...btn, background: action === a ? '#3b82f6' : '#2a2a3a', fontSize: 11, padding: '6px 8px' }}>
              {a === 'github.create_issue' ? 'Create Issue' : a === 'github.create_comment' ? 'Comment' : a === 'github.list_issues' ? 'List Issues' : a === 'github.get_issue' ? 'Get Issue' : 'List Comments'}
            </button>
          ))}
        </div>

        {isReadOnly && <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 8 }}>Read-only: no approval required</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Owner (e.g. talocode)" value={owner} onChange={e => setOwner(e.target.value)} style={input} />
          <input placeholder="Repo (e.g. worklane)" value={repo} onChange={e => setRepo(e.target.value)} style={input} />
        </div>

        {action === 'github.create_issue' && (
          <>
            <input placeholder="Issue title" value={issueTitle} onChange={e => setIssueTitle(e.target.value)} style={input} />
            <textarea placeholder="Issue body (optional)" value={issueBody} onChange={e => setIssueBody(e.target.value)} style={{ ...input, minHeight: 60 }} />
            <input placeholder="Labels (comma-separated, optional)" value={issueLabels} onChange={e => setIssueLabels(e.target.value)} style={input} />
          </>
        )}

        {action === 'github.create_comment' && (
          <>
            <input placeholder="Issue number" type="number" value={issueNumber} onChange={e => setIssueNumber(e.target.value)} style={input} />
            <textarea placeholder="Comment body" value={commentBody} onChange={e => setCommentBody(e.target.value)} style={{ ...input, minHeight: 60 }} />
            <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>Comment will be posted only after approval and execution.</div>
          </>
        )}

        {action === 'github.list_issues' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <select value={listState} onChange={e => setListState(e.target.value)} style={input}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="all">All</option>
              </select>
              <input placeholder="Labels (comma-sep, optional)" value={listLabels} onChange={e => setListLabels(e.target.value)} style={input} />
              <input placeholder="Limit (1-50)" type="number" value={listLimit} onChange={e => setListLimit(e.target.value)} style={input} />
            </div>
          </>
        )}

        {action === 'github.get_issue' && (
          <input placeholder="Issue number" type="number" value={issueNumber} onChange={e => setIssueNumber(e.target.value)} style={input} />
        )}

        {action === 'github.list_issue_comments' && (
          <>
            <input placeholder="Issue number" type="number" value={issueNumber} onChange={e => setIssueNumber(e.target.value)} style={input} />
            <input placeholder="Limit (1-50)" type="number" value={listLimit} onChange={e => setListLimit(e.target.value)} style={input} />
            <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>Comment bodies are shown as previews (max 500 chars).</div>
          </>
        )}

        <button onClick={createRun} style={btn}>Create Run</button>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
          {isReadOnly ? 'Read-only actions execute immediately without approval.' : 'Write actions require approval before any GitHub action is performed.'}
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Runs ({runs.length})</h2>
      {runs.length === 0 && <p style={{ color: '#666' }}>No runs yet.</p>}
      {runs.slice().reverse().map(r => (
        <div key={r.id} style={listItem}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{r.task}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ ...badge, background: r.executionMode === 'simulated' ? '#7c3aed22' : r.toolAction && READ_ONLY_ACTIONS.includes(r.toolAction) ? '#0ea5e922' : '#22c55e22', color: r.executionMode === 'simulated' ? '#a78bfa' : r.toolAction && READ_ONLY_ACTIONS.includes(r.toolAction) ? '#38bdf8' : '#4ade80' }}>
                {r.executionMode === 'simulated' ? 'SIMULATED' : r.toolAction && READ_ONLY_ACTIONS.includes(r.toolAction) ? 'READ' : 'REAL'}
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
              {r.toolInput.owner}/{r.toolInput.repo}
              {r.toolAction === 'github.create_issue' && r.toolInput.title && ` — ${r.toolInput.title}`}
              {r.toolAction === 'github.create_comment' && r.toolInput.issueNumber && ` — #${r.toolInput.issueNumber}`}
              {r.toolAction === 'github.list_issues' && ` — state: ${r.toolInput.state || 'open'}, limit: ${r.toolInput.limit || 20}`}
              {r.toolAction === 'github.get_issue' && r.toolInput.issueNumber && ` — #${r.toolInput.issueNumber}`}
              {r.toolAction === 'github.list_issue_comments' && r.toolInput.issueNumber && ` — #${r.toolInput.issueNumber} (limit: ${r.toolInput.limit || 20})`}
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
          {r.result && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 6, fontFamily: 'monospace', maxHeight: 100, overflow: 'auto' }}>{r.result}</div>}
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
