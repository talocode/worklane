'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  skills: string[];
  status: string;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [runTask, setRunTask] = useState('');
  const [runAgentId, setRunAgentId] = useState('');
  const [message, setMessage] = useState('');

  const load = () => fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || []));
  useEffect(() => { load(); }, []);

  const createAgent = async () => {
    if (!name) return;
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, skills: skills.split(',').map(s => s.trim()).filter(Boolean) }),
    });
    setName(''); setDescription(''); setSkills('');
    load();
  };

  const runAgent = async () => {
    if (!runAgentId || !runTask) return;
    const res = await fetch(`/api/agents/${runAgentId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: runTask }),
    });
    const data = await res.json();
    setMessage(`Run created: ${data.run?.id} (${data.run?.status}) — executionMode: ${data.run?.executionMode}`);
    setRunTask('');
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Agents</h1>

      <div style={{ ...section, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Create Agent</h2>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={input} />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={input} />
        <input placeholder="Skills (comma-separated)" value={skills} onChange={e => setSkills(e.target.value)} style={input} />
        <button onClick={createAgent} style={btn}>Create</button>
      </div>

      <div style={{ ...section, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Run Agent Task</h2>
        <select value={runAgentId} onChange={e => setRunAgentId(e.target.value)} style={input}>
          <option value="">Select agent...</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input placeholder="Task description" value={runTask} onChange={e => setRunTask(e.target.value)} style={input} />
        <button onClick={runAgent} style={btn}>Run Task</button>
        {message && <div style={{ marginTop: 8, fontSize: 13, color: '#4ade80' }}>{message}</div>}
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Agents ({agents.length})</h2>
        {agents.map(a => (
          <div key={a.id} style={listItem}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{a.name}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{a.description || 'No description'}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Skills: {a.skills.join(', ') || 'none'} · Status: {a.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const section: React.CSSProperties = { padding: 20, background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 8 };
const input: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 12px', marginBottom: 8, background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 6, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const listItem: React.CSSProperties = { padding: '12px 16px', background: '#16161e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 8 };
