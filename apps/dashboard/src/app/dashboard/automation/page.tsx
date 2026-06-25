'use client';

import { useEffect, useState } from 'react';

export default function AutomationPage() {
  const [loops, setLoops] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/automation/loops').then((response) => response.json()),
      fetch('/api/automation/routines').then((response) => response.json()),
      fetch('/api/automation/runs').then((response) => response.json()),
    ]).then(([loopsData, routinesData, runsData]) => {
      setLoops(loopsData.loops || []);
      setRoutines(routinesData.routines || []);
      setRuns(runsData.runs || []);
    });
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Loops & Routines</h1>
      <div style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 6, marginBottom: 24, fontSize: 13, color: '#93c5fd' }}>
        v0.1: local-first automation. Server must be running. Every run remains approval-first.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
        <h2 style={heading}>Recent Automation Runs</h2>
        {runs.length === 0 && <p style={{ color: '#666' }}>No automation runs yet.</p>}
        {runs.slice().reverse().map((run) => (
          <div key={run.id} style={listItem}>
            <div style={{ fontWeight: 500 }}>{run.sourceName}</div>
            <div style={copy}>{run.status} · {run.runMode} · approval required</div>
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
