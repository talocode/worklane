'use client';

import { useEffect, useState } from 'react';
import styles from './maintainer.module.css';

interface Routine {
  id: string;
  name: string;
  description: string;
  risk: string;
  defaultCadence: string;
  steps: string[];
}

interface Run {
  id: string;
  routineName: string;
  repo: string;
  baseRef: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  executionMode: 'simulated';
  limits: { maxFiles: number; maxPatchLines: number; maxRuntimeMinutes: number };
  report: Record<string, unknown>;
}

export default function MaintainerPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [routineId, setRoutineId] = useState('flaky-test-diagnosis');
  const [repo, setRepo] = useState('');
  const [baseRef, setBaseRef] = useState('main');
  const [maxFiles, setMaxFiles] = useState(20);
  const [maxPatchLines, setMaxPatchLines] = useState(300);
  const [maxRuntimeMinutes, setMaxRuntimeMinutes] = useState(20);
  const [notes, setNotes] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const [routineData, runData] = await Promise.all([
      fetch('/api/maintenance/routines').then((response) => response.json()),
      fetch('/api/maintenance/runs').then((response) => response.json()),
    ]);
    setRoutines(routineData.routines || []);
    setRuns((runData.runs || []).slice().reverse());
  };

  useEffect(() => {
    refresh().catch(() => setError('Failed to load Maintainer data.'));
  }, []);

  const createRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/maintenance/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineId, repo, baseRef, maxFiles, maxPatchLines, maxRuntimeMinutes, notes }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to create run.');
      setSelectedRunId(data.run.id);
      await refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to create run.');
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setError(null);
    const response = await fetch(`/api/maintenance/runs/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'reject' ? JSON.stringify({ reason: 'Rejected during Maintainer review.' }) : undefined,
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.error || `Failed to ${action} run.`);
      return;
    }
    await refresh();
  };

  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>WorkLane Maintainer</p>
          <h1 className={styles.title}>Maintenance proposals with proof.</h1>
          <p className={styles.subtitle}>
            Create bounded repository-maintenance runs, inspect the required evidence contract, and keep execution behind human approval.
          </p>
        </div>
        <div className={styles.mode}>SIMULATED EXECUTION</div>
      </header>

      <div className={styles.notice}>
        This release prepares approval-first runs. It does not inspect repositories or generate real findings until a repository execution tool is connected.
      </div>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>1. Choose a routine</h2>
          {routines.map((routine) => (
            <button
              key={routine.id}
              className={`${styles.routine} ${routine.id === routineId ? styles.routineSelected : ''}`}
              onClick={() => setRoutineId(routine.id)}
            >
              <span className={styles.routineName}><span>{routine.name}</span><span>{routine.risk} risk</span></span>
              <span className={styles.routineMeta}>{routine.description}</span>
              <span className={styles.routineMeta}>{routine.defaultCadence} | {routine.steps.length} evidence stages</span>
            </button>
          ))}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>2. Bound the run</h2>
          <div className={styles.formGrid}>
            <div className={styles.fieldWide}>
              <label className={styles.label}>Repository</label>
              <input className={styles.input} value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repository" />
            </div>
            <div className={styles.fieldWide}>
              <label className={styles.label}>Base reference</label>
              <input className={styles.input} value={baseRef} onChange={(event) => setBaseRef(event.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Maximum files</label>
              <input className={styles.input} type="number" min={1} max={500} value={maxFiles} onChange={(event) => setMaxFiles(Number(event.target.value))} />
            </div>
            <div>
              <label className={styles.label}>Maximum patch lines</label>
              <input className={styles.input} type="number" min={1} max={5000} value={maxPatchLines} onChange={(event) => setMaxPatchLines(Number(event.target.value))} />
            </div>
            <div>
              <label className={styles.label}>Maximum runtime, minutes</label>
              <input className={styles.input} type="number" min={1} max={120} value={maxRuntimeMinutes} onChange={(event) => setMaxRuntimeMinutes(Number(event.target.value))} />
            </div>
            <div className={styles.fieldWide}>
              <label className={styles.label}>Review notes</label>
              <textarea className={styles.textarea} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.button} disabled={loading || !repo.trim()} onClick={createRun}>
              {loading ? 'Preparing run...' : 'Prepare approval run'}
            </button>
          </div>
        </section>
      </div>

      <section className={styles.panel} style={{ marginTop: 20 }}>
        <h2 className={styles.panelTitle}>3. Review runs</h2>
        {runs.length === 0 && <p className={styles.copy}>No maintenance runs yet.</p>}
        <div className={styles.runs}>
          {runs.map((run) => (
            <article className={styles.run} key={run.id} onClick={() => setSelectedRunId(run.id)}>
              <div className={styles.runTop}>
                <div>
                  <strong>{run.routineName}</strong>
                  <div className={styles.copy}>{run.repo}@{run.baseRef}</div>
                  <div className={styles.copy}>Limits: {run.limits.maxFiles} files | {run.limits.maxPatchLines} lines | {run.limits.maxRuntimeMinutes} minutes</div>
                </div>
                <span className={styles.status}>{run.status}</span>
              </div>
              {run.status === 'pending_approval' && (
                <div className={styles.buttonRow}>
                  <button className={styles.button} onClick={(event) => { event.stopPropagation(); decide(run.id, 'approve'); }}>Approve run</button>
                  <button className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonDanger}`} onClick={(event) => { event.stopPropagation(); decide(run.id, 'reject'); }}>Reject</button>
                </div>
              )}
            </article>
          ))}
        </div>
        {selectedRun && (
          <div className={styles.report}>
            <strong>Evidence contract: {selectedRun.id}</strong>
            <pre>{JSON.stringify(selectedRun.report, null, 2)}</pre>
          </div>
        )}
      </section>
    </main>
  );
}
