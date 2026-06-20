import path from "node:path";
import { promises as fs } from "node:fs";
import { exerciseTestsDir } from "../exercises";
import type { GradeResult, SubmittedFile, TestCase } from "../types";
import {
  assertDockerUp,
  imageExists,
  runContainer,
  withTempDir,
} from "./docker";

const IMAGE = "osprep-bash:latest";
const START = "===OSPREP-RESULT-START===";
const END = "===OSPREP-RESULT-END===";

interface GraderJson {
  shellcheck: { code: number; output: string };
  bats: { code: number; tap: string };
}

export interface GradeBashParams {
  id: string;
  entrypoint: string;
  points: number;
  files: SubmittedFile[];
  lint?: "strict" | "relaxed";
  lintExclude?: string[];
}

/** Parse bats TAP output into discrete test cases. */
function parseTap(tap: string): TestCase[] {
  const tests: TestCase[] = [];
  const lines = tap.split(/\r?\n/);
  let current: TestCase | null = null;
  for (const line of lines) {
    const m = /^(ok|not ok)\s+(\d+)\s+(.*)$/.exec(line);
    if (m) {
      current = { name: m[3].trim(), passed: m[1] === "ok" };
      tests.push(current);
    } else if (current && /^\s*#/.test(line)) {
      const note = line.replace(/^\s*#\s?/, "");
      current.detail = current.detail ? `${current.detail}\n${note}` : note;
    }
  }
  return tests;
}

function extractJson(raw: string): GraderJson | null {
  const s = raw.indexOf(START);
  const e = raw.indexOf(END);
  if (s === -1 || e === -1 || e < s) return null;
  const json = raw.slice(s + START.length, e).trim();
  try {
    return JSON.parse(json) as GraderJson;
  } catch {
    return null;
  }
}

export async function gradeBash(params: GradeBashParams): Promise<GradeResult> {
  const base: Omit<GradeResult, "ok" | "score"> = {
    maxScore: params.points,
    timedOut: false,
    tests: [],
    rawOutput: "",
  };

  try {
    await assertDockerUp();
  } catch (err) {
    return { ...base, ok: false, score: 0, error: (err as Error).message };
  }
  if (!(await imageExists(IMAGE))) {
    return {
      ...base,
      ok: false,
      score: 0,
      error: `Image ${IMAGE} not found. Build it: bash docker/build-images.sh`,
    };
  }

  const entryFile =
    params.files.find((f) => f.name === params.entrypoint) ?? params.files[0];
  if (!entryFile) {
    return { ...base, ok: false, score: 0, error: "no submission file" };
  }

  const run = await withTempDir("osprep-bash-", async (dir) => {
    // student entrypoint — normalize CRLF/CR -> LF so editor/Windows line
    // endings don't break bash inside the Linux sandbox.
    await fs.writeFile(
      path.join(dir, params.entrypoint),
      entryFile.content.replace(/\r\n?/g, "\n"),
      "utf8",
    );
    // exercise tests
    await fs.cp(exerciseTestsDir(params.id), path.join(dir, "tests"), {
      recursive: true,
    });
    // "relaxed" → only shellcheck errors gate; "strict" → everything.
    const severity = params.lint === "relaxed" ? "error" : "style";
    const exclude = (params.lintExclude ?? []).join(",");
    return runContainer({
      image: IMAGE,
      cmd: [params.entrypoint, severity, exclude],
      workDir: dir,
      timeoutMs: 20_000,
    });
  });

  const parsed = extractJson(run.output);
  if (!parsed) {
    return {
      ...base,
      ok: false,
      score: 0,
      timedOut: run.timedOut,
      rawOutput: run.output,
      error: run.timedOut
        ? "Execution timed out."
        : "Could not parse grader output.",
    };
  }

  const tests = parseTap(parsed.bats.tap);
  const lintPassed = parsed.shellcheck.code === 0;
  const passedCount = tests.filter((t) => t.passed).length;
  const allTestsPassed = tests.length > 0 && passedCount === tests.length;

  // Score: tests are the bulk; shellcheck is required for a perfect pass.
  const score =
    tests.length === 0
      ? 0
      : Math.round((passedCount / tests.length) * params.points);

  return {
    ...base,
    ok: allTestsPassed && lintPassed,
    score,
    timedOut: run.timedOut,
    lint: {
      name: "shellcheck",
      passed: lintPassed,
      output: parsed.shellcheck.output || "No issues found.",
    },
    tests,
    rawOutput: run.output,
  };
}
