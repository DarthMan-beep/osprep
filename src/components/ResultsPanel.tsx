"use client";

import { useState } from "react";
import type { GradeResult } from "@/lib/types";
import { t, type Locale } from "@/lib/i18n";

export function ResultsPanel({
  running,
  result,
  locale = "en",
}: {
  running: boolean;
  result: GradeResult | null;
  locale?: Locale;
}) {
  const [showRaw, setShowRaw] = useState(false);

  if (running) {
    return (
      <div className="h-56 shrink-0 overflow-y-auto border-t border-neutral-800 p-4 text-sm text-neutral-400">
        {t(locale, "res.spinning")}
      </div>
    );
  }
  if (!result) {
    return (
      <div className="h-56 shrink-0 overflow-y-auto border-t border-neutral-800 p-4 text-sm text-neutral-500">
        {t(locale, "res.pressRun")}
      </div>
    );
  }

  return (
    <div className="h-56 shrink-0 overflow-y-auto border-t border-neutral-800 p-4 text-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <span
          className={`rounded px-2 py-1 font-semibold ${
            result.ok
              ? "bg-emerald-900 text-emerald-300"
              : "bg-red-950 text-red-300"
          }`}
        >
          {result.ok ? t(locale, "res.passed") : t(locale, "res.notYet")}
        </span>
        <span className="text-neutral-400">
          {t(locale, "res.score")}: {result.score}/{result.maxScore}
        </span>
        {result.timedOut && (
          <span className="text-amber-400">{t(locale, "res.timedOut")}</span>
        )}
      </div>

      {result.error && (
        <div className="mb-3 rounded border border-red-900 bg-red-950/50 p-2 text-red-300">
          {result.error}
        </div>
      )}

      {result.lint && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span>{result.lint.passed ? "✅" : "⚠️"}</span>
            <span className="font-medium text-neutral-300">
              {result.lint.name}
            </span>
          </div>
          {!result.lint.passed && (
            <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-900 p-2 text-xs text-amber-300">
              {result.lint.output}
            </pre>
          )}
        </div>
      )}

      {result.tests.length > 0 && (
        <ul className="space-y-1">
          {result.tests.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{t.passed ? "✅" : "❌"}</span>
              <span
                className={t.passed ? "text-neutral-300" : "text-red-300"}
              >
                {t.name}
                {t.detail && (
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-900 p-2 text-xs text-neutral-400">
                    {t.detail}
                  </pre>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {result.rawOutput && (
        <div className="mt-3">
          <button
            onClick={() => setShowRaw((s) => !s)}
            className="text-xs text-neutral-500 underline hover:text-neutral-300"
          >
            {showRaw ? t(locale, "res.hideRaw") : t(locale, "res.showRaw")}
          </button>
          {showRaw && (
            <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-900 p-2 text-xs text-neutral-500">
              {result.rawOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
