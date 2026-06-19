// Pure i18n strings + helpers. No server-only imports here, so client
// components can import `t`/`dict` too. Locale is resolved server-side
// (see locale.server.ts) and passed down as a prop where needed.

export type Locale = "en" | "mk";
export const LOCALES: Locale[] = ["en", "mk"];
export const DEFAULT_LOCALE: Locale = "en";

export type Dict = Record<string, string>;

const STRINGS: Record<Locale, Dict> = {
  en: {
    "app.tagline": "bash · docker · synchronization",
    "home.title": "Operating Systems — practical prep",
    "home.subtitle":
      "Read the guides, then solve exercises in a real sandbox — each one is auto-graded against tests.",
    "home.solved": "Solved",
    "home.guides": "Study guides",
    "home.exercises": "Exercises",
    "home.noExercises": "No exercises yet.",
    "topic.bash": "Bash scripting",
    "topic.unix": "Unix commands",
    "topic.docker": "Docker",
    "topic.sync": "Synchronization",
    "wb.run": "▶ Run & Grade",
    "wb.running": "Running…",
    "wb.reset": "reset",
    "wb.solved": "✓ solved",
    "wb.saving": "saving…",
    "wb.saved": "saved",
    "wb.min": "min",
    "wb.pts": "pts",
    "wb.allTopics": "← all topics",
    "res.spinning": "Spinning up sandbox container…",
    "res.pressRun":
      "Press Run & Grade to execute your solution in a sandbox and check it against the tests.",
    "res.passed": "PASSED",
    "res.notYet": "NOT YET",
    "res.score": "Score",
    "res.timedOut": "⏱ timed out",
    "res.showRaw": "show raw output",
    "res.hideRaw": "hide raw output",
    "res.noIssues": "No issues found.",
  },
  mk: {
    "app.tagline": "bash · docker · синхронизација",
    "home.title": "Оперативни системи — подготовка за практичен испит",
    "home.subtitle":
      "Прочитајте ги водичите, па решавајте задачи во вистинско песочниче — секоја се оценува автоматски со тестови.",
    "home.solved": "Решени",
    "home.guides": "Водичи за учење",
    "home.exercises": "Задачи",
    "home.noExercises": "Сè уште нема задачи.",
    "topic.bash": "Bash скриптирање",
    "topic.unix": "Unix команди",
    "topic.docker": "Docker",
    "topic.sync": "Синхронизација",
    "wb.run": "▶ Изврши и оцени",
    "wb.running": "Се извршува…",
    "wb.reset": "ресетирај",
    "wb.solved": "✓ решено",
    "wb.saving": "се зачувува…",
    "wb.saved": "зачувано",
    "wb.min": "мин",
    "wb.pts": "поени",
    "wb.allTopics": "← сите теми",
    "res.spinning": "Се подига контејнер-песочниче…",
    "res.pressRun":
      "Притиснете Изврши и оцени за да го извршите решението во песочниче и да го проверите со тестовите.",
    "res.passed": "ПОМИНАТО",
    "res.notYet": "СЀ УШТЕ НЕ",
    "res.score": "Поени",
    "res.timedOut": "⏱ истече времето",
    "res.showRaw": "прикажи суров излез",
    "res.hideRaw": "скриј суров излез",
    "res.noIssues": "Нема пронајдени проблеми.",
  },
};

export function t(locale: Locale, key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Topic label, localized. */
export function topicLabel(locale: Locale, topic: string): string {
  return t(locale, `topic.${topic}`) === `topic.${topic}`
    ? topic
    : t(locale, `topic.${topic}`);
}
