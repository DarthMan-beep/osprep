import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Exercise, ExerciseFile, ExerciseManifest } from "./types";
import type { Locale } from "./i18n";

/** Apply Macedonian title/summary overrides when present. */
function localizeManifest(m: ExerciseManifest, locale: Locale): ExerciseManifest {
  if (locale !== "mk") return m;
  return {
    ...m,
    title: m.title_mk ?? m.title,
    summary: m.summary_mk ?? m.summary,
  };
}

/** Read PROBLEM.<locale>.md, falling back to PROBLEM.md. */
async function readProblem(dir: string, locale: Locale): Promise<string> {
  if (locale !== "en") {
    try {
      return await fs.readFile(path.join(dir, `PROBLEM.${locale}.md`), "utf8");
    } catch {
      /* fall back to English */
    }
  }
  return fs.readFile(path.join(dir, "PROBLEM.md"), "utf8");
}

// Exercises live at <repo>/exercises/<topic>/<slug>/...
export const EXERCISES_ROOT = path.join(process.cwd(), "exercises");

function exerciseDir(id: string): string {
  // id is "topic/slug"; guard against traversal.
  const safe = id.replace(/\\/g, "/");
  if (safe.includes("..") || path.isAbsolute(safe)) {
    throw new Error(`invalid exercise id: ${id}`);
  }
  return path.join(EXERCISES_ROOT, safe);
}

async function readDirFiles(dir: string): Promise<ExerciseFile[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const files: ExerciseFile[] = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = await fs.stat(full);
    if (stat.isFile()) {
      files.push({ name, content: await fs.readFile(full, "utf8") });
    }
  }
  return files;
}

export async function loadExercise(
  id: string,
  locale: Locale = "en",
): Promise<Exercise> {
  const dir = exerciseDir(id);
  const manifestRaw = await fs.readFile(path.join(dir, "manifest.yaml"), "utf8");
  const manifest = localizeManifest(
    yaml.load(manifestRaw) as ExerciseManifest,
    locale,
  );
  const problemMarkdown = await readProblem(dir, locale);
  const starterFiles = await readDirFiles(path.join(dir, "starter"));
  return { manifest, problemMarkdown, starterFiles };
}

/** Absolute path to an exercise's tests/ directory (server-side grading only). */
export function exerciseTestsDir(id: string): string {
  return path.join(exerciseDir(id), "tests");
}

/** Walk the exercises tree and return every manifest (for listing). */
export async function listExercises(
  locale: Locale = "en",
): Promise<ExerciseManifest[]> {
  const out: ExerciseManifest[] = [];
  let topics: string[];
  try {
    topics = await fs.readdir(EXERCISES_ROOT);
  } catch {
    return out;
  }
  for (const topic of topics) {
    const topicDir = path.join(EXERCISES_ROOT, topic);
    if (!(await fs.stat(topicDir)).isDirectory()) continue;
    for (const slug of await fs.readdir(topicDir)) {
      const manifestPath = path.join(topicDir, slug, "manifest.yaml");
      try {
        const raw = await fs.readFile(manifestPath, "utf8");
        out.push(localizeManifest(yaml.load(raw) as ExerciseManifest, locale));
      } catch {
        // not an exercise dir; skip
      }
    }
  }
  return out.sort(
    (a, b) => a.topic.localeCompare(b.topic) || a.difficulty - b.difficulty,
  );
}
