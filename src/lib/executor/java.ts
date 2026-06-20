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

const IMAGE = "osprep-java:latest";

export interface GradeJavaParams {
  id: string;
  entrypoint: string; // the .java file the student edits (e.g. Counter.java)
  points: number;
  files: SubmittedFile[];
  testClass?: string; // driver class to run (default OSPrepTest)
}

/** Pull the text between two markers in the grader's output. */
function section(raw: string, name: string): string {
  const start = `===OSPREP-${name}===`;
  const i = raw.indexOf(start);
  if (i === -1) return "";
  const after = raw.slice(i + start.length);
  const next = after.indexOf("\n===OSPREP-");
  return (next === -1 ? after : after.slice(0, next)).replace(/^\r?\n/, "").trimEnd();
}

/** Parse TAP (`ok N desc` / `not ok N desc`) into test cases. */
function parseTap(tap: string): TestCase[] {
  const tests: TestCase[] = [];
  let current: TestCase | null = null;
  for (const line of tap.split(/\r?\n/)) {
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

export async function gradeJava(params: GradeJavaParams): Promise<GradeResult> {
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
      error: `Image ${IMAGE} not found. Build it: docker build -t osprep-java:latest ./docker/java`,
    };
  }

  const entryFile =
    params.files.find((f) => f.name === params.entrypoint) ?? params.files[0];
  if (!entryFile) {
    return { ...base, ok: false, score: 0, error: "no submission file" };
  }

  const run = await withTempDir("osprep-java-", async (dir) => {
    // student entrypoint (normalize line endings for the Linux toolchain)
    await fs.writeFile(
      path.join(dir, params.entrypoint),
      entryFile.content.replace(/\r\n?/g, "\n"),
      "utf8",
    );
    // copy the test driver(s) alongside, flattened into /work
    const testsDir = exerciseTestsDir(params.id);
    for (const name of await fs.readdir(testsDir)) {
      await fs.copyFile(path.join(testsDir, name), path.join(dir, name));
    }
    return runContainer({
      image: IMAGE,
      cmd: [params.testClass ?? "OSPrepTest"],
      workDir: dir,
      timeoutMs: 90_000,
      memoryBytes: 512 * 1024 * 1024,
    });
  });

  const compileCode = parseInt(section(run.output, "COMPILE-CODE"), 10);
  const compileOut = section(run.output, "COMPILE-OUT");
  const tapCode = parseInt(section(run.output, "TAP-CODE"), 10);
  const tap = section(run.output, "TAP");

  // Missing markers ⇒ the container itself was killed (outer timeout).
  if (Number.isNaN(compileCode)) {
    return {
      ...base,
      ok: false,
      score: 0,
      timedOut: run.timedOut,
      rawOutput: run.output,
      error: run.timedOut ? "Execution timed out." : "Could not parse grader output.",
    };
  }

  const compilePassed = compileCode === 0;
  if (!compilePassed) {
    return {
      ...base,
      ok: false,
      score: 0,
      lint: { name: "javac", passed: false, output: compileOut || "compilation failed" },
      rawOutput: run.output,
    };
  }

  // tapCode 124 = `timeout` killed the JVM → almost certainly a deadlock.
  const innerTimedOut = tapCode === 124;
  const tests = parseTap(tap);
  const passedCount = tests.filter((t) => t.passed).length;
  const allPassed = tests.length > 0 && passedCount === tests.length;
  const score =
    tests.length === 0 ? 0 : Math.round((passedCount / tests.length) * params.points);

  return {
    ...base,
    ok: allPassed && !innerTimedOut,
    score: innerTimedOut ? 0 : score,
    timedOut: run.timedOut || innerTimedOut,
    lint: { name: "javac", passed: true, output: "Compiled successfully." },
    tests:
      innerTimedOut && tests.length === 0
        ? [{ name: "completes without deadlock (within 30s)", passed: false }]
        : tests,
    rawOutput: run.output,
    error: innerTimedOut ? "Timed out — likely a deadlock or an infinite loop." : undefined,
  };
}
