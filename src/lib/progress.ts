import { promises as fs } from "node:fs";
import path from "node:path";

// Per-user progress: saved code + solved status, persisted to a JSON file so it
// survives restarts and is shared across browsers (single-user local tool).
const DIR = path.join(process.cwd(), "userdata");
const FILE = path.join(DIR, "progress.json");

export interface ProgressEntry {
  code?: string;
  solved?: boolean;
  bestScore?: number;
  maxScore?: number;
  updatedAt?: string;
}
export type ProgressMap = Record<string, ProgressEntry>;

export async function readProgress(): Promise<ProgressMap> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as ProgressMap;
  } catch {
    return {};
  }
}

export async function readEntry(id: string): Promise<ProgressEntry | undefined> {
  return (await readProgress())[id];
}

export async function upsertProgress(
  id: string,
  patch: ProgressEntry,
): Promise<ProgressEntry> {
  const map = await readProgress();
  const cur = map[id] ?? {};
  const next: ProgressEntry = { ...cur };

  // Apply only defined fields so an autosave of just `code` never wipes status.
  if (patch.code !== undefined) next.code = patch.code;
  if (patch.maxScore !== undefined) next.maxScore = patch.maxScore;
  if (patch.bestScore !== undefined) {
    next.bestScore = Math.max(cur.bestScore ?? 0, patch.bestScore);
  }
  if (patch.solved) next.solved = true; // sticky: "ever solved"
  next.updatedAt = new Date().toISOString();

  map[id] = next;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
  return next;
}

/** Remove an exercise's entry entirely (reset to a clean, unsolved slate). */
export async function removeEntry(id: string): Promise<void> {
  const map = await readProgress();
  if (!(id in map)) return;
  delete map[id];
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
}
