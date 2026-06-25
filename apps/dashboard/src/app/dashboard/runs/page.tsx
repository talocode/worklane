'use client';

import { useEffect, useState } from 'react';

type GitHubAction =
  | 'github.create_issue'
  | 'github.create_comment'
  | 'github.list_issues'
  | 'github.get_issue'
  | 'github.list_issue_comments'
  | 'github.search_issues';

const READ_ONLY_ACTIONS: GitHubAction[] = [
  'github.list_issues',
  'github.get_issue',
  'github.list_issue_comments',
  'github.search_issues',
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIncludePrs, setSearchIncludePrs] = useState(false);
  const [message, setMessage] = useState('');

  const isReadOnly = READ_ONLY_ACTIONS.includes(action);

  const load = () => {
    fetch('/api/runs').then((response) => response.json()).then((data) => setRuns(data.runs || data.data?.runs || []));
    fetch('/api/agents').then((response) => response.json()).then((data) => setAgents(data.agents || data.data?.agents || []));
  };

  useEffect(() => {
    load();
  }, []);

  const createRun = async () => {
    if (!selectedAgent || !owner || !repo) {
      setMessage('Agent, owner, and repo are required');
      return;
    }

    let toolInput: Record<string, unknown> = {};
    let taskDescription = '';

    if (action === 'github.create_issue') {
      if (!issueTitle) {
        setMessage('Issue title is required');
        return;
      }
      toolInput = {
        owner,
        repo,
        title: issueTitle,
        body: issueBody || undefined,
        labels: issueLabels ? issueLabels.split(',').map((label) => label.trim()).filter(Boolean) : undefined,
      };
      taskDescription = `Create GitHub issue: ${issueTitle}`;
    } else if (action === 'github.create_comment') {
      if (!issueNumber || !commentBody) {
        setMessage('Issue number and comment body are required');
        return;
      }
      toolInput = { owner, repo, issueNumber: parseInt(issueNumber, 10), body: commentBody };
      taskDescription = `Comment on GitHub issue #${issueNumber}`;
    } else if (action === 'github.list_issues') {
      toolInput = {
        owner,
        repo,
        state: listState,
        labels: listLabels ? listLabels.split(',').map((label) => label.trim()).filter(Boolean) : undefined,
        limit: parseInt(listLimit, 10) || 20,
      };
      taskDescription = `List GitHub issues in ${owner}/${repo}`;
    } else if (action === 'github.get_issue') {
      if (!issueNumber) {
        setMessage('Issue number is required');
        return;
      }
      toolInput = { owner, repo, issueNumber: parseInt(issueNumber, 10) };
      taskDescription = `Get GitHub issue #${issueNumber} from ${owner}/${repo}`;
    } else if (action === 'github.list_issue_comments') {
      if (!issueNumber) {
        setMessage('Issue number is required');
        return;
      }
      toolInput = { owner, repo, issueNumber: parseInt(issueNumber, 10), limit: parseInt(listLimit, 10) || 20 };
      taskDescription = `List comments on GitHub issue #${issueNumber}`;
    } else if (action === 'github.search_issues') {
      if (!searchQuery) {
        setMessage('Search query is required');
        return;
      }
      toolInput = {
        query: searchQuery,
        owner: owner || undefined,
        repo: repo || undefined,
        state: listState,
        labels: listLabels ? listLabels.split(',').map((label) => label.trim()).filter(Boolean) : undefined,
        limit: parseInt(listLimit, 10) || 20,
        includePullRequests: searchIncludePrs,
      };
      taskDescription = `Search GitHub issues: ${searchQuery}`;
    }

    const response = await fetch(`/api/agents/${selectedAgent}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskDescription, toolAction: action, toolInput, executionMode: 'live' }),
    });
    const data = await response.json();
    setMessage(
      isReadOnly
        ? `Read-only run created: ${data.run?.id} - no approval required`
        : `Run created: ${data.run?.id} - approval required before execution`,
    );
    setIssueTitle('');
    setIssueBody('');
    setIssueLabels('');
    setIssueNumber('');
    setCommentBody('');
    load();
  };

  const approve = async (id: string) => {
    await fetch(`/api/runs/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Approved from dashboard' }),
    });
    setMessage('Run approved. Click Execute to run the tool action.');
    load();
  };

  const execute = async (id: string) => {
    setMessage('Executing...');
    const response = await fetch(`/api/runs/${id}/execute`, { method: 'POST' });
    const data = await response.json();
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

        <select value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value)} style={input}>
          <option value="">Select agent...</option>
          {agents.map((agent: any) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
        </select>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {([
            'github.create_issue',
            'github.create_comment',
            'github.list_issues',
            'github.get_issue',
            'github.list_issue_comments',
            'github.search_issues',
          ] as GitHubAction[]).map((item) => (
            <button key={item} onClick={() => setAction(item)} style={{ ...buttonStyle, background: action === item ? '#3b82f6' : '#2a2a3a', fontSize: 11, padding: '6px 8px' }}>
              {item === 'github.create_issue'
                ? 'Create Issue'
                : item === 'github.create_comment'
                  ? 'Comment'
                  : item === 'github.list_issues'
                    ? 'List Issues'
                    : item === 'github.get_issue'
                      ? 'Get Issue'
                      : item === 'github.list_issue_comments'
                        ? 'List Comments'
                        : 'Search Issues'}
            </button>
          ))}
        </div>

        {isReadOnly && <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 8 }}>Read-only: no approval required</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Owner (e.g. talocode)" value={owner} onChange={(event) => setOwner(event.target.value)} style={input} />
          <input placeholder="Repo (e.g. worklane)" value={repo} onChange={(event) => setRepo(event.target.value)} style={input} />
        </div>

        {action === 'github.create_issue' && (
          <>
            <input placeholder="Issue title" value={issueTitle} onChange={(event) => setIssueTitle(event.target.value)} style={input} />
            <textarea placeholder="Issue body (optional)" value={issueBody} onChange={(event) => setIssueBody(event.target.value)} style={{ ...input, minHeight: 60 }} />
            <input placeholder="Labels (comma-separated, optional)" value={issueLabels} onChange={(event) => setIssueLabels(event.target.value)} style={input} />
          </>
        )}

        {action === 'github.create_comment' && (
          <>
            <input placeholder="Issue number" type="number" value={issueNumber} onChange={(event) => setIssueNumber(event.target.value)} style={input} />
            <textarea placeholder="Comment body" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} style={{ ...input, minHeight: 60 }} />
            <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>Comment will be posted only after approval and execution.</div>
          </>
        )}

        {action === 'github.list_issues' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <select value={listState} onChange={(event) => setListState(event.target.value)} style={input}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
            <input placeholder="Labels (comma-sep, optional)" value={listLabels} onChange={(event) => setListLabels(event.target.value)} style={input} />
            <input placeholder="Limit (1-50)" type="number" value={listLimit} onChange={(event) => setListLimit(event.target.value)} style={input} />
          </div>
        )}

        {action === 'github.get_issue' && (
          <input placeholder="Issue number" type="number" value={issueNumber} onChange={(event) => setIssueNumber(event.target.value)} style={input} />
        )}

        {action === 'github.list_issue_comments' && (
          <>
            <input placeholder="Issue number" type="number" value={issueNumber} onChange={(event) => setIssueNumber(event.target.value)} style={input} />
            <input placeholder="Limit (1-50)" type="number" value={listLimit} onChange={(event) => setListLimit(event.target.value)} style={input} />
            <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>Comment bodies are shown as previews (max 500 chars).</div>
          </>
        )}

        {action === 'github.search_issues' && (
          <>
            <input placeholder="Search query (e.g. auth bug, dashboard error)" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} style={input} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <input placeholder="Owner/org (optional)" value={owner} onChange={(event) => setOwner(event.target.value)} style={input} />
              <input placeholder="Repo (optional, needs owner)" value={repo} onChange={(event) => setRepo(event.target.value)} style={input} />
              <select value={listState} onChange={(event) => setListState(event.target.value)} style={input}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="all">All</option>
              </select>
            </div>
            <input placeholder="Labels (comma-sep, optional)" value={listLabels} onChange={(event) => setListLabels(event.target.value)} style={input} />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
              <input placeholder="Limit (1-50)" type="number" value={listLimit} onChange={(event) => setListLimit(event.target.value)} style={{ ...input, width: 120, marginBottom: 0 }} />
              <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={searchIncludePrs} onChange={(event) => setSearchIncludePrs(event.target.checked)} /> Include pull requests
              </label>
            </div>
            <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>Searches across repos. Pull requests excluded by default.</div>
          </>
        )}

        <button onClick={createRun} style={buttonStyle}>Create Run</button>
        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
          {isReadOnly ? 'Read-only actions execute immediately without approval.' : 'Write actions require approval before any GitHub action is performed.'}
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Runs ({runs.length})</h2>
      {runs.length === 0 && <p style={{ color: '#666' }}>No runs yet. Create one from the Agents or Actions page.</p>}
      {runs.slice().reverse().map((run) => (
        <div key={run.id} style={listItem}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{run.task || run.toolAction || 'Task Run'}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span
                style={{
                  ...badge,
                  background:
                    run.executionMode === 'simulated'
                      ? '#7c3aed22'
                      : run.toolAction && READ_ONLY_ACTIONS.includes(run.toolAction)
                        ? '#0ea5e922'
                        : '#22c55e22',
                  color:
                    run.executionMode === 'simulated'
                      ? '#a78bfa'
                      : run.toolAction && READ_ONLY_ACTIONS.includes(run.toolAction)
                        ? '#38bdf8'
                        : '#4ade80',
                }}
              >
                {run.executionMode === 'simulated' ? 'SIMULATED' : run.toolAction && READ_ONLY_ACTIONS.includes(run.toolAction) ? 'READ' : 'LIVE'}
              </span>
              {run.toolAction && <span style={{ ...badge, background: '#3b82f622', color: '#60a5fa' }}>{run.toolAction}</span>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Status: <span style={{ color: statusColor(run.status) }}>{run.status}</span>
            {' · '}Risk: {run.riskLevel}
            {' · '}{new Date(run.createdAt).toLocaleString()}
          </div>
          {run.toolInput && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 4, fontFamily: 'monospace' }}>
              {run.toolInput.owner}/{run.toolInput.repo}
              {run.toolAction === 'github.create_issue' && run.toolInput.title && ` - ${run.toolInput.title}`}
              {run.toolAction === 'github.create_comment' && run.toolInput.issueNumber && ` - #${run.toolInput.issueNumber}`}
              {run.toolAction === 'github.list_issues' && ` - state: ${run.toolInput.state || 'open'}, limit: ${run.toolInput.limit || 20}`}
              {run.toolAction === 'github.get_issue' && run.toolInput.issueNumber && ` - #${run.toolInput.issueNumber}`}
              {run.toolAction === 'github.list_issue_comments' && run.toolInput.issueNumber && ` - #${run.toolInput.issueNumber} (limit: ${run.toolInput.limit || 20})`}
              {run.toolAction === 'github.search_issues' && run.toolInput.query && ` - "${String(run.toolInput.query).slice(0, 40)}${String(run.toolInput.query).length > 40 ? '...' : ''}"`}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {run.status === 'pending_approval' && (
              <button onClick={() => approve(run.id)} style={{ ...buttonStyle, background: '#22c55e', fontSize: 12, padding: '4px 10px' }}>Approve</button>
            )}
            {run.status === 'approved' && (
              <button onClick={() => execute(run.id)} style={{ ...buttonStyle, background: '#3b82f6', fontSize: 12, padding: '4px 10px' }}>Execute</button>
            )}
            {(run.status === 'pending_approval' || run.status === 'approved') && (
              <button onClick={() => cancel(run.id)} style={{ ...buttonStyle, background: '#ef4444', fontSize: 12, padding: '4px 10px' }}>Cancel</button>
            )}
          </div>
          {run.result && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 6, fontFamily: 'monospace', maxHeight: 100, overflow: 'auto' }}>{run.result}</div>}
          {run.error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{run.error}</div>}
        </div>
      ))}
    </div>
  );
}

function statusColor(status: string) {
  if (status === 'completed') return '#4ade80';
  if (status === 'approved') return '#60a5fa';
  if (status === 'pending_approval') return '#fbbf24';
  if (status === 'running') return '#60a5fa';
  if (status === 'failed') return '#ef4444';
  if (status === 'cancelled') return '#888';
  return '#e0e0e0';
}

const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginBottom: 8,
  background: '#0a0a0f',
  border: '1px solid #2a2a3a',
  borderRadius: 6,
  color: '#e0e0e0',
  fontSize: 14,
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '6px 14px',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  background: '#3b82f6',
};

const listItem: React.CSSProperties = {
  padding: '16px 20px',
  background: '#16161e',
  border: '1px solid #2a2a3a',
  borderRadius: 6,
  marginBottom: 12,
};

const badge: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.5,
};
