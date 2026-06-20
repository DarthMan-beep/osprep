import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { exerciseContextDir } from "../exercises";
import type { DockerCheck, GradeResult, SubmittedFile, TestCase } from "../types";
import { assertDockerUp, withTempDir } from "./docker";

export interface GradeDockerParams {
  id: string;
  entrypoint: string; // "Dockerfile" or, for compose, "compose.yaml"
  points: number;
  files: SubmittedFile[];
  checks: DockerCheck[];
  compose?: boolean;
}

/** Run the `docker` CLI; never rejects — returns exit code + combined output. */
function docker(
  args: string[],
  timeoutMs: number,
  cwd?: string,
): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(
      "docker",
      args,
      { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024, windowsHide: true, cwd },
      (err, stdout, stderr) => {
        const out = `${stdout ?? ""}${stderr ?? ""}`;
        const e = err as (NodeJS.ErrnoException & { code?: number }) | null;
        const code = !e ? 0 : typeof e.code === "number" ? e.code : 1;
        resolve({ code, out });
      },
    );
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function copyDir(src: string, dest: string): Promise<void> {
  try {
    await fs.cp(src, dest, { recursive: true });
  } catch {
    /* no context dir — fine */
  }
}

export async function gradeDocker(params: GradeDockerParams): Promise<GradeResult> {
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

  const dockerfile =
    params.files.find((f) => f.name === params.entrypoint) ?? params.files[0];
  if (!dockerfile) {
    return { ...base, ok: false, score: 0, error: "no submission file" };
  }

  if (params.compose) {
    return gradeCompose(params, dockerfile, base);
  }

  const tag = `osprep-sub-${randomUUID().slice(0, 12)}`;
  const containers: string[] = [];
  let buildLog = "";
  const tests: TestCase[] = [];

  try {
    const built = await withTempDir("osprep-docker-", async (dir) => {
      await copyDir(exerciseContextDir(params.id), dir);
      await fs.writeFile(
        path.join(dir, params.entrypoint),
        dockerfile.content.replace(/\r\n?/g, "\n"),
        "utf8",
      );
      // 4 min: first build may pull a base image.
      return docker(["build", "-t", tag, dir], 240_000);
    });
    buildLog = built.out;

    if (built.code !== 0) {
      return {
        ...base,
        ok: false,
        score: 0,
        lint: { name: "docker build", passed: false, output: tailLines(built.out, 25) },
        rawOutput: built.out,
      };
    }

    for (const check of params.checks) {
      if (check.type === "stdout") {
        const run = await docker(["run", "--rm", ...(check.runArgs ?? []), tag], 30_000);
        const out = run.out.trim();
        let pass = run.code === 0;
        if (pass && check.equals !== undefined) pass = out === check.equals.trim();
        if (pass && check.contains !== undefined) pass = out.includes(check.contains);
        tests.push({
          name: check.name,
          passed: pass,
          detail: pass ? undefined : `got:\n${tailLines(run.out, 12)}`,
        });
      } else if (check.type === "http") {
        const name = `osprep-run-${randomUUID().slice(0, 12)}`;
        const hostPort = 20000 + Math.floor(Math.random() * 20000);
        const runArgs = check.runArgs ?? [];
        const start = await docker(
          ["run", "-d", "--name", name, "-p", `${hostPort}:${check.containerPort}`, ...runArgs, tag],
          30_000,
        );
        if (start.code !== 0) {
          tests.push({ name: check.name, passed: false, detail: `could not start container:\n${tailLines(start.out, 8)}` });
          continue;
        }
        containers.push(name);
        const url = `http://localhost:${hostPort}${check.path ?? "/"}`;
        const want = check.status ?? 200;
        const verdict = await probeHttp(url, want, check.contains);
        tests.push({ name: check.name, passed: verdict.ok, detail: verdict.ok ? undefined : verdict.detail });
      }
    }

    const passed = tests.filter((t) => t.passed).length;
    const allPassed = tests.length > 0 && passed === tests.length;
    return {
      ...base,
      ok: allPassed,
      score: tests.length === 0 ? 0 : Math.round((passed / tests.length) * params.points),
      lint: { name: "docker build", passed: true, output: "Image built successfully." },
      tests,
      rawOutput: buildLog,
    };
  } finally {
    for (const c of containers) await docker(["rm", "-f", c], 20_000);
    await docker(["rmi", "-f", tag], 30_000);
  }
}

/** Grade a multi-service app via `docker compose up` on the student's compose file. */
async function gradeCompose(
  params: GradeDockerParams,
  composeFile: SubmittedFile,
  base: Omit<GradeResult, "ok" | "score">,
): Promise<GradeResult> {
  const project = `osprep-${randomUUID().slice(0, 12)}`;
  const tests: TestCase[] = [];
  return withTempDir("osprep-compose-", async (dir) => {
    await copyDir(exerciseContextDir(params.id), dir);
    await fs.writeFile(
      path.join(dir, params.entrypoint),
      composeFile.content.replace(/\r\n?/g, "\n"),
      "utf8",
    );
    try {
      const up = await docker(
        ["compose", "-p", project, "-f", params.entrypoint, "up", "-d", "--build"],
        300_000,
        dir,
      );
      if (up.code !== 0) {
        return {
          ...base,
          ok: false,
          score: 0,
          lint: { name: "docker compose up", passed: false, output: tailLines(up.out, 30) },
          rawOutput: up.out,
        };
      }
      for (const check of params.checks) {
        if (check.type === "http") {
          const port = check.hostPort ?? check.containerPort ?? 80;
          const url = `http://localhost:${port}${check.path ?? "/"}`;
          const v = await probeHttp(url, check.status ?? 200, check.contains);
          tests.push({ name: check.name, passed: v.ok, detail: v.ok ? undefined : v.detail });
        }
      }
      const passed = tests.filter((t) => t.passed).length;
      const all = tests.length > 0 && passed === tests.length;
      return {
        ...base,
        ok: all,
        score: tests.length === 0 ? 0 : Math.round((passed / tests.length) * params.points),
        lint: { name: "docker compose up", passed: true, output: "Services started." },
        tests,
        rawOutput: up.out,
      };
    } finally {
      await docker(
        ["compose", "-p", project, "-f", params.entrypoint, "down", "-v", "--rmi", "local", "--remove-orphans"],
        60_000,
        dir,
      );
    }
  });
}

/** Poll an HTTP endpoint until the container is ready (or we give up). */
async function probeHttp(
  url: string,
  wantStatus: number,
  contains?: string,
): Promise<{ ok: boolean; detail?: string }> {
  let last = "no response";
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url);
      const body = await res.text();
      if (res.status !== wantStatus) {
        last = `status ${res.status}, expected ${wantStatus}`;
      } else if (contains !== undefined && !body.includes(contains)) {
        last = `status ${res.status} ok, but body missing "${contains}"`;
      } else {
        return { ok: true };
      }
    } catch (e) {
      last = `request failed: ${(e as Error).message}`;
    }
    await sleep(500);
  }
  return { ok: false, detail: `${url} — ${last}` };
}

function tailLines(s: string, n: number): string {
  const lines = s.replace(/\s+$/, "").split(/\r?\n/);
  return lines.slice(-n).join("\n");
}
