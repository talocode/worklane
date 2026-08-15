import * as fs from 'fs';
import * as path from 'path';
import type { MaintenanceRunRecord } from './types';

const DATA_DIR = path.join(process.cwd(), '.worklane', 'maintenance');
const RUNS_FILE = path.join(DATA_DIR, 'runs.json');

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readRuns(): MaintenanceRunRecord[] {
  ensureDir();
  if (!fs.existsSync(RUNS_FILE)) return [];
  return JSON.parse(fs.readFileSync(RUNS_FILE, 'utf-8')) as MaintenanceRunRecord[];
}

function writeRuns(runs: MaintenanceRunRecord[]): void {
  ensureDir();
  fs.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 2), 'utf-8');
}

export const maintenanceStorage = {
  paths: { runs: RUNS_FILE },
  runs: {
    list: readRuns,
    get: (id: string) => readRuns().find((run) => run.id === id),
    save: (run: MaintenanceRunRecord) => {
      const runs = readRuns();
      const index = runs.findIndex((item) => item.id === run.id);
      if (index === -1) runs.push(run);
      else runs[index] = run;
      writeRuns(runs);
      return run;
    },
  },
};
