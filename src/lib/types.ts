// Shared domain types for exercises and grading.

export type ExerciseKind = "bash" | "docker" | "java";

export interface ExerciseManifest {
  id: string; // e.g. "bash/greet"
  title: string;
  topic: string;
  kind: ExerciseKind;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  points: number;
  entrypoint: string; // the file the student edits & that is graded
  tags: string[];
  summary: string;
  title_mk?: string; // optional Macedonian title/summary overrides
  summary_mk?: string;
  /**
   * Lint strictness for bash exercises:
   *  - "strict" (default): any shellcheck finding fails the exercise.
   *  - "relaxed": only shellcheck *errors* gate (style/info/warning nits, e.g.
   *    SC2126 `grep|wc -l`, are ignored) — right for "write a command" tasks.
   */
  lint?: "strict" | "relaxed";
  /** Specific shellcheck codes to ignore for this exercise, e.g. ["SC2018"].
   *  Use when a rule's advice conflicts with the task (not to hide real issues). */
  lintExclude?: string[];
}

export interface ExerciseFile {
  name: string;
  content: string;
}

/** Everything the UI needs to render & run an exercise. */
export interface Exercise {
  manifest: ExerciseManifest;
  problemMarkdown: string;
  starterFiles: ExerciseFile[];
}

export interface SubmittedFile {
  name: string;
  content: string;
}

// ---- Grading results -------------------------------------------------------

export interface TestCase {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface GradeResult {
  ok: boolean; // true if the submission passed every required check
  score: number; // 0..points
  maxScore: number;
  timedOut: boolean;
  /** Lint / syntax stage (e.g. shellcheck). */
  lint?: {
    name: string;
    passed: boolean;
    output: string;
  };
  /** Behavioral test cases. */
  tests: TestCase[];
  /** Raw container output, for debugging / "show details". */
  rawOutput: string;
  error?: string; // infra-level error (docker down, image missing, ...)
}
