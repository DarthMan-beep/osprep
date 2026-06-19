import path from "node:path";
import { promises as fs } from "node:fs";
import {
  assertDockerUp,
  imageExists,
  runContainer,
  withTempDir,
} from "./docker";

const IMAGE = "osprep-bash:latest";

export interface PlaygroundResult {
  output: string; // combined stdout + stderr
  exitCode: number;
  timedOut: boolean;
  error?: string; // infra-level error (docker down / image missing)
}

/**
 * Run arbitrary bash in the sandbox — no grading. The code is written to
 * main.sh and executed with `bash`; optional stdin is piped from a file.
 */
export async function runPlayground(
  code: string,
  stdin?: string,
): Promise<PlaygroundResult> {
  try {
    await assertDockerUp();
  } catch (err) {
    return { output: "", exitCode: -1, timedOut: false, error: (err as Error).message };
  }
  if (!(await imageExists(IMAGE))) {
    return {
      output: "",
      exitCode: -1,
      timedOut: false,
      error: `Image ${IMAGE} not found. Build it: docker build -t osprep-bash:latest ./docker/bash`,
    };
  }

  const run = await withTempDir("osprep-pg-", async (dir) => {
    await fs.writeFile(path.join(dir, "main.sh"), code, "utf8");
    let shell = "bash /work/main.sh";
    if (stdin) {
      await fs.writeFile(path.join(dir, "input.txt"), stdin, "utf8");
      shell = "bash /work/main.sh < /work/input.txt";
    }
    return runContainer({
      image: IMAGE,
      entrypoint: ["/bin/sh", "-c"], // bypass the image's `grade` entrypoint
      cmd: [shell],
      workDir: dir,
      timeoutMs: 15_000,
    });
  });

  return {
    output: run.output,
    exitCode: run.statusCode,
    timedOut: run.timedOut,
  };
}
