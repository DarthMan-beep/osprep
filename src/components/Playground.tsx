"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { t, type Locale } from "@/lib/i18n";

type Mode = "commands" | "scripts";

interface PlaygroundResult {
  output: string;
  exitCode: number;
  timedOut: boolean;
  error?: string;
}

const DEFAULT_COMMANDS = `# Try commands or pipelines here, then press Run.
ls -la /
echo "hello world" | tr a-z A-Z | rev
`;

const DEFAULT_SCRIPT = `#!/bin/bash
# A scratch script — experiment freely.
for i in 1 2 3; do
  echo "line $i"
done
`;

const LS = {
  commands: "osprep-pg-commands",
  scripts: "osprep-pg-scripts",
  stdin: "osprep-pg-stdin",
};

export function Playground({ locale = "en" }: { locale?: Locale }) {
  const [mode, setMode] = useState<Mode>("commands");
  const [commands, setCommands] = useState(DEFAULT_COMMANDS);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PlaygroundResult | null>(null);

  // Hydrate saved buffers from localStorage (after mount, to avoid SSR mismatch).
  useEffect(() => {
    const c = localStorage.getItem(LS.commands);
    const s = localStorage.getItem(LS.scripts);
    const i = localStorage.getItem(LS.stdin);
    if (c !== null) setCommands(c);
    if (s !== null) setScript(s);
    if (i !== null) setStdin(i);
  }, []);

  const code = mode === "commands" ? commands : script;
  const setCode = (v: string) =>
    mode === "commands" ? setCommands(v) : setScript(v);

  function persist(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore quota errors */
    }
  }

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stdin }),
      });
      setResult((await res.json()) as PlaygroundResult);
    } catch (err) {
      setResult({
        output: "",
        exitCode: -1,
        timedOut: false,
        error: `Request failed: ${(err as Error).message}`,
      });
    } finally {
      setRunning(false);
    }
  }

  const tabClass = (m: Mode) =>
    `rounded px-3 py-1.5 text-sm font-medium transition ${
      mode === m
        ? "bg-neutral-700 text-white"
        : "text-neutral-400 hover:text-neutral-200"
    }`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-bold">{t(locale, "pg.title")}</h1>
      <p className="mt-1 text-neutral-400">{t(locale, "pg.subtitle")}</p>
      <p className="mt-2 text-xs text-neutral-500">{t(locale, "pg.sandboxNote")}</p>

      <div className="mt-5 flex items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
          <button className={tabClass("commands")} onClick={() => setMode("commands")}>
            {t(locale, "pg.commands")}
          </button>
          <button className={tabClass("scripts")} onClick={() => setMode("scripts")}>
            {t(locale, "pg.scripts")}
          </button>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="ml-auto rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? t(locale, "pg.running") : t(locale, "pg.run")}
        </button>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Editor + stdin */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-neutral-800">
            <Editor
              height={mode === "commands" ? "220px" : "360px"}
              theme="vs-dark"
              language="shell"
              value={code}
              onChange={(v) => {
                const val = v ?? "";
                setCode(val);
                persist(mode === "commands" ? LS.commands : LS.scripts, val);
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                tabSize: 2,
                lineNumbers: mode === "commands" ? "off" : "on",
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">
              {t(locale, "pg.stdin")}
            </label>
            <textarea
              value={stdin}
              onChange={(e) => {
                setStdin(e.target.value);
                persist(LS.stdin, e.target.value);
              }}
              spellCheck={false}
              rows={4}
              placeholder={t(locale, "pg.cmdPlaceholder")}
              className="w-full resize-y rounded-lg border border-neutral-800 bg-neutral-900 p-3 font-mono text-sm text-neutral-200 outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t(locale, "pg.output")}
            </span>
            {result && !result.error && (
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  result.exitCode === 0
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-red-950 text-red-300"
                }`}
              >
                {t(locale, "pg.exit")}: {result.exitCode}
              </span>
            )}
            {result?.timedOut && (
              <span className="text-xs text-amber-400">⏱</span>
            )}
          </div>
          <pre className="min-h-[300px] flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-neutral-800 bg-[#1e1e1e] p-3 font-mono text-sm text-neutral-200">
            {running
              ? "…"
              : result?.error
                ? `⚠ ${result.error}`
                : result
                  ? result.output || "(no output)"
                  : t(locale, "pg.empty")}
          </pre>
        </div>
      </div>
    </main>
  );
}
