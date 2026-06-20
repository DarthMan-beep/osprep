"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { Exercise, GradeResult } from "@/lib/types";
import { t, topicLabel, type Locale } from "@/lib/i18n";
import { ResultsPanel } from "./ResultsPanel";

const LANG_BY_KIND: Record<string, string> = {
  bash: "shell",
  docker: "dockerfile",
  java: "java",
};

/** Pick the Monaco language from the file name first, then fall back to kind. */
function editorLanguage(entrypoint: string, kind: string): string {
  if (/\.ya?ml$/i.test(entrypoint)) return "yaml";
  if (/^Dockerfile/i.test(entrypoint)) return "dockerfile";
  if (/\.java$/i.test(entrypoint)) return "java";
  if (/\.sh$/i.test(entrypoint)) return "shell";
  return LANG_BY_KIND[kind] ?? "plaintext";
}

type SaveState = "idle" | "saving" | "saved";

export function Workbench({
  exercise,
  problemHtml,
  savedCode,
  alreadySolved,
  locale = "en",
}: {
  exercise: Exercise;
  problemHtml: string;
  savedCode?: string;
  alreadySolved?: boolean;
  locale?: Locale;
}) {
  const { manifest, starterFiles } = exercise;
  const starter =
    starterFiles.find((f) => f.name === manifest.entrypoint)?.content ??
    starterFiles[0]?.content ??
    "";

  const [code, setCode] = useState(savedCode ?? starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [solved, setSolved] = useState(!!alreadySolved);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist code to the server, debounced, whenever it changes.
  useEffect(() => {
    if (code === (savedCode ?? starter) && saveState === "idle") return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: manifest.id, code }),
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function resetToStarter() {
    setCode(starter);
    setSolved(false);
    setResult(null);
    setSaveState("idle");
    // Wipe this exercise's saved progress so it returns to an unsolved slate.
    fetch("/api/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: manifest.id }),
    }).catch(() => {});
  }

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: manifest.id,
          files: [{ name: manifest.entrypoint, content: code }],
        }),
      });
      const graded = (await res.json()) as GradeResult;
      setResult(graded);
      if (graded.ok) setSolved(true);
      // Persist code + solved status alongside the run.
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: manifest.id,
          code,
          solved: graded.ok,
          score: graded.score,
          maxScore: graded.maxScore,
        }),
      }).catch(() => {});
    } catch (err) {
      setResult({
        ok: false,
        score: 0,
        maxScore: manifest.points,
        timedOut: false,
        tests: [],
        rawOutput: "",
        error: `Request failed: ${(err as Error).message}`,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-2">
      {/* Problem */}
      <section className="overflow-y-auto border-r border-neutral-800 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-neutral-800 px-2 py-1 font-mono tracking-wide text-neutral-300">
            {topicLabel(locale, manifest.topic)}
          </span>
          <span className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">
            {"★".repeat(manifest.difficulty)}
            <span className="text-neutral-600">
              {"★".repeat(5 - manifest.difficulty)}
            </span>
          </span>
          <span className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">
            ~{manifest.estimatedMinutes} {t(locale, "wb.min")}
          </span>
          <span className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">
            {manifest.points} {t(locale, "wb.pts")}
          </span>
        </div>
        <article
          className="prose prose-invert prose-sm max-w-none prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none"
          dangerouslySetInnerHTML={{ __html: problemHtml }}
        />
      </section>

      {/* Editor + results */}
      <section className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-neutral-400">
              {manifest.entrypoint}
            </span>
            {solved && (
              <span className="rounded bg-emerald-900 px-1.5 py-0.5 text-xs text-emerald-300">
                {t(locale, "wb.solved")}
              </span>
            )}
            <span className="text-xs text-neutral-600">
              {saveState === "saving"
                ? t(locale, "wb.saving")
                : saveState === "saved"
                  ? t(locale, "wb.saved")
                  : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToStarter}
              className="rounded px-2 py-1.5 text-xs text-neutral-500 transition hover:text-neutral-300"
            >
              {t(locale, "wb.reset")}
            </button>
            <button
              onClick={run}
              disabled={running}
              className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? t(locale, "wb.running") : t(locale, "wb.run")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            theme="vs-dark"
            language={editorLanguage(manifest.entrypoint, manifest.kind)}
            onMount={(editor, monaco) =>
              editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF)
            }
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        </div>

        <ResultsPanel running={running} result={result} locale={locale} />
      </section>
    </div>
  );
}
