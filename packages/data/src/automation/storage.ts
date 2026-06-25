import * as fs from 'fs';
import * as path from 'path';
import type { AutomationHistoryEntry, AutomationRunRecord, WorkLaneLoop, WorkLaneRoutine } from './types';

const DATA_DIR = path.join(process.cwd(), '.worklane', 'automation');
const LOOPS_FILE = path.join(DATA_DIR, 'loops.json');
const ROUTINES_FILE = path.join(DATA_DIR, 'routines.json');
const RUNS_FILE = path.join(DATA_DIR, 'runs.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string): T[] {
  ensureDir();
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
}

function writeJson<T>(filePath: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const automationStorage = {
  paths: {
    loops: LOOPS_FILE,
    routines: ROUTINES_FILE,
    runs: RUNS_FILE,
    history: HISTORY_FILE,
  },
  loops: {
    list: () => readJson<WorkLaneLoop>(LOOPS_FILE),
    get: (id: string) => readJson<WorkLaneLoop>(LOOPS_FILE).find((loop) => loop.id === id),
    save: (loop: WorkLaneLoop) => {
      const loops = readJson<WorkLaneLoop>(LOOPS_FILE);
      const index = loops.findIndex((item) => item.id === loop.id);
      if (index === -1) loops.push(loop);
      else loops[index] = loop;
      writeJson(LOOPS_FILE, loops);
      return loop;
    },
  },
  routines: {
    list: () => readJson<WorkLaneRoutine>(ROUTINES_FILE),
    get: (id: string) => readJson<WorkLaneRoutine>(ROUTINES_FILE).find((routine) => routine.id === id),
    save: (routine: WorkLaneRoutine) => {
      const routines = readJson<WorkLaneRoutine>(ROUTINES_FILE);
      const index = routines.findIndex((item) => item.id === routine.id);
      if (index === -1) routines.push(routine);
      else routines[index] = routine;
      writeJson(ROUTINES_FILE, routines);
      return routine;
    },
  },
  runs: {
    list: () => readJson<AutomationRunRecord>(RUNS_FILE),
    get: (id: string) => readJson<AutomationRunRecord>(RUNS_FILE).find((run) => run.id === id),
    save: (run: AutomationRunRecord) => {
      const runs = readJson<AutomationRunRecord>(RUNS_FILE);
      const index = runs.findIndex((item) => item.id === run.id);
      if (index === -1) runs.push(run);
      else runs[index] = run;
      writeJson(RUNS_FILE, runs);
      return run;
    },
  },
  history: {
    list: () => readJson<AutomationHistoryEntry>(HISTORY_FILE),
    append: (entry: AutomationHistoryEntry) => {
      const items = readJson<AutomationHistoryEntry>(HISTORY_FILE);
      items.push(entry);
      writeJson(HISTORY_FILE, items);
      return entry;
    },
  },
};
