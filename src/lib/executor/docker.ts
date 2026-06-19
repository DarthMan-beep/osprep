import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import Docker from "dockerode";
import tar from "tar-fs";

// On Windows, Docker Desktop exposes the engine over a named pipe; elsewhere a
// unix socket. dockerode picks sensible defaults, but honor DOCKER_HOST too.
function makeDocker(): Docker {
  if (process.env.DOCKER_HOST) return new Docker();
  if (process.platform === "win32") {
    return new Docker({ socketPath: "\\\\.\\pipe\\docker_engine" });
  }
  return new Docker({ socketPath: "/var/run/docker.sock" });
}

export interface RunResult {
  output: string; // combined stdout+stderr (container runs with a TTY)
  statusCode: number; // container exit code (-1 if it never exited cleanly)
  timedOut: boolean;
}

export interface RunOptions {
  image: string;
  cmd: string[];
  /** Override the image ENTRYPOINT (e.g. to run arbitrary bash, not `grade`). */
  entrypoint?: string[];
  /** Host directory whose contents are copied into /work before start. */
  workDir: string;
  timeoutMs?: number;
  memoryBytes?: number;
}

/** Confirm the daemon is reachable; throws a friendly error otherwise. */
export async function assertDockerUp(): Promise<void> {
  const docker = makeDocker();
  try {
    await docker.ping();
  } catch {
    throw new Error(
      "Docker daemon is not reachable. Start Docker Desktop and try again.",
    );
  }
}

export async function imageExists(image: string): Promise<boolean> {
  const docker = makeDocker();
  try {
    await docker.getImage(image).inspect();
    return true;
  } catch {
    return false;
  }
}

/**
 * Pack a host directory into a tar stream for putArchive. We force unix modes
 * because Windows files carry no permission bits — without this, directories
 * land without the execute bit and become untraversable inside the container.
 */
function packDir(dir: string): NodeJS.ReadableStream {
  return tar.pack(dir, { dmode: 0o755, fmode: 0o644 });
}

/**
 * Run a one-shot command in an ephemeral container with the given work dir
 * copied to /work. Network is disabled and resources are capped. The container
 * is always removed afterward.
 */
export async function runContainer(opts: RunOptions): Promise<RunResult> {
  const docker = makeDocker();
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const memoryBytes = opts.memoryBytes ?? 256 * 1024 * 1024;

  const container = await docker.createContainer({
    Image: opts.image,
    ...(opts.entrypoint ? { Entrypoint: opts.entrypoint } : {}),
    Cmd: opts.cmd,
    Tty: true, // raw, un-multiplexed output
    WorkingDir: "/work",
    HostConfig: {
      NetworkMode: "none",
      Memory: memoryBytes,
      MemorySwap: memoryBytes, // disallow swap growth
      PidsLimit: 256,
      AutoRemove: false,
      CapDrop: ["ALL"],
    },
  });

  let timedOut = false;
  try {
    await container.putArchive(packDir(opts.workDir), { path: "/work" });
    await container.start();

    const timeout = new Promise<{ StatusCode: number }>((resolve) =>
      setTimeout(() => {
        timedOut = true;
        resolve({ StatusCode: -1 });
      }, timeoutMs),
    );
    const result = (await Promise.race([container.wait(), timeout])) as {
      StatusCode: number;
    };

    if (timedOut) {
      await container.kill().catch(() => {});
    }

    // Collect output from a log stream. The buffered `logs()` overload can
    // occasionally resolve to a non-Buffer for fast, tiny-output containers,
    // so we stream and concatenate instead (Tty:true ⇒ raw, un-multiplexed).
    const output = await new Promise<string>((resolve) => {
      container.logs(
        { follow: true, stdout: true, stderr: true },
        (err, stream) => {
          if (err || !stream) {
            resolve("");
            return;
          }
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          const done = () => resolve(Buffer.concat(chunks).toString("utf8"));
          stream.on("end", done);
          stream.on("close", done);
          stream.on("error", done);
        },
      );
    });

    return {
      output,
      statusCode: result.StatusCode,
      timedOut,
    };
  } finally {
    await container.remove({ force: true }).catch(() => {});
  }
}

/** Create a fresh temp dir, hand it to `fill`, and clean it up afterward. */
export async function withTempDir<T>(
  prefix: string,
  fill: (dir: string) => Promise<T>,
): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fill(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
