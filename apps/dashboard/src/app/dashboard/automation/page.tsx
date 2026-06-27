'use client';

import { useEffect, useState } from 'react';

export default function AutomationPage() {
  const [loops, setLoops] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);

  const load = () => {
    Promise.all([
      fetch('/api/automation/loops').then((response) => response.json()),
      fetch('/api/automation/routines').then((response) => response.json()),
      fetch('/api/automation/runs').then((response) => response.json()),
      fetch('/api/automation/approvals').then((response) => response.json()),
    ]).then(([loopsData, routinesData, runsData, approvalsData]) => {
      setLoops(loopsData.loops || []);
      setRoutines(routinesData.routines || []);
      setRuns(runsData.runs || []);
      setApprovals(approvalsData.runs || []);
    });
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await fetch(`/api/automation/approvals/${id}/approve`, { method: 'POST' });
    load();
  };

  const reject = async (id: string) => {
    await fetch(`/api/automation/approvals/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Rejected from dashboard review.' }) });
    load();
  };

  const handoff = async (id: string) => {
    await fetch(`/api/automation/approvals/${id}/handoff`, { method: 'POST' });
    load();
  };

  const pendingApprovals = approvals.filter((run) => run.approvalStatus === 'pending');
  const approvedAwaitingHandoff = approvals.filter((run) => run.approvalStatus === 'approved' && (run.handoffStatus === 'not_started' || run.handoffStatus === 'failed'));
  const rejectedRuns = approvals.filter((run) => run.approvalStatus === 'rejected');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Loops & Routines</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#93c5fd' }}>
        v0.1: local-first automation. Server must be running. Every run remains approval-first.
      </div>
      <p style={{ marginTop: 0, marginBottom: 20, fontSize: 13, color: '#94a3b8' }}>
        Need a safe starting pattern? Browse <a href="/dashboard/loop-starters" style={{ color: '#93c5fd' }}>Loop Starter Kits</a>.
        Approved automation handoffs become visible in <a href="/dashboard/execution" style={{ color: '#93c5fd' }}>Execution Queue</a> before any safe supported execution step.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={panel}>
          <h2 style={heading}>Pending Approval Runs</h2>
          {pendingApprovals.length === 0 && <p style={{ color: '#666' }}>No pending approval runs.</p>}
          {pendingApprovals.map((run) => (
            <div key={run.id} style={listItem}>
              <div style={{ fontWeight: 500 }}>{run.sourceName}</div>
              <div style={copy}>{run.sourceType} · {run.triggerType} · {new Date(run.createdAt).toLocaleString()}</div>
              <div style={copy}>Profile: {run.permissionProfile} · tools: {(run.toolGatewayToolIds || []).join(', ') || '(manual)'}</div>
              <div style={copy}>{run.task}</div>
              {run.warnings?.map((warning: string) => <div key={warning} style={{ ...copy, color: '#fbbf24' }}>{warning}</div>)}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => approve(run.id)} style={{ ...buttonStyle, background: '#16a34a' }}>Approve</button>
                <button onClick={() => reject(run.id)} style={{ ...buttonStyle, background: '#dc2626' }}>Reject</button>
              </div>
            </div>
          ))}
        </section>
        <section style={panel}>
          <h2 style={heading}>Approved Awaiting Handoff</h2>
          {approvedAwaitingHandoff.length === 0 && <p style={{ color: '#666' }}>No approved runs awaiting handoff.</p>}
          {approvedAwaitingHandoff.map((run) => (
            <div key={run.id} style={listItem}>
              <div style={{ fontWeight: 500 }}>{run.sourceName}</div>
              <div style={copy}>Approved by {run.approvedBy || 'user'} · {run.approvedAt || 'pending timestamp'}</div>
              <div style={copy}>Target tools: {(run.toolGatewayToolIds || []).join(', ') || '(manual)'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => handoff(run.id)} style={{ ...buttonStyle, background: '#2563eb' }}>Handoff</button>
              </div>
            </div>
          ))}
        </section>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <section style={panel}>
          <h2 style={heading}>Active Loops</h2>
          {loops.map((loop) => (
            <div key={loop.id} style={listItem}>
              <div style={{ fontWeight: 500 }}>{loop.name}</div>
              <div style={copy}>{loop.status} · next {loop.nextRunAt} · approval required</div>
            </div>
          ))}
        </section>
        <section style={panel}>
          <h2 style={heading}>Saved Routines</h2>
          {routines.map((routine) => (
            <div key={routine.id} style={listItem}>
              <div style={{ fontWeight: 500 }}>{routine.name}</div>
              <div style={copy}>{routine.status} · trigger {routine.triggerType} · approval required</div>
            </div>
          ))}
        </section>
      </div>
      <section style={{ ...panel, marginTop: 24 }}>
        <h2 style={heading}>Rejected Runs</h2>
        {rejectedRuns.length === 0 && <p style={{ color: '#666' }}>No rejected runs.</p>}
        {rejectedRuns.map((run) => (
          <div key={run.id} style={listItem}>
            <div style={{ fontWeight: 500 }}>{run.sourceName}</div>
            <div style={copy}>Rejected by {run.rejectedBy || 'user'} · {run.rejectedAt || 'unknown time'}</div>
            <div style={copy}>{run.rejectionReason || 'No rejection reason recorded.'}</div>
          </div>
        ))}
      </section>
      <section style={{ ...panel, marginTop: 24 }}>
        <h2 style={heading}>Recent Automation Activity</h2>
        {runs.length === 0 && <p style={{ color: '#666' }}>No automation runs yet.</p>}
        {runs.slice().reverse().map((run) => (
          <div key={run.id} style={listItem}>
            <div style={{ fontWeight: 500 }}>{run.sourceName}</div>
            <div style={copy}>{run.status} · {run.runMode} · approval {run.approvalStatus || 'pending'} · handoff {run.handoffStatus || 'not_started'}</div>
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
const buttonStyle: React.CSSProperties = { padding: '6px 12px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
