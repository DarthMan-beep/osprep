import Link from "next/link";
import { listExercises } from "@/lib/exercises";
import { listGuides } from "@/lib/guides";
import { readProgress } from "@/lib/progress";
import { getLocale } from "@/lib/locale.server";
import { t, topicLabel } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const [exercises, guides, progress] = await Promise.all([
    listExercises(locale),
    listGuides(locale),
    readProgress(),
  ]);
  const byTopic = new Map<string, typeof exercises>();
  for (const ex of exercises) {
    if (!byTopic.has(ex.topic)) byTopic.set(ex.topic, []);
    byTopic.get(ex.topic)!.push(ex);
  }
  const solvedCount = exercises.filter((e) => progress[e.id]?.solved).length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">{t(locale, "home.title")}</h1>
      <p className="mt-1 text-neutral-400">{t(locale, "home.subtitle")}</p>
      <p className="mt-3 inline-block rounded bg-neutral-900 px-3 py-1 text-sm text-neutral-300">
        {t(locale, "home.solved")}{" "}
        <span className="font-semibold text-emerald-400">{solvedCount}</span> /{" "}
        {exercises.length}
      </p>

      {guides.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t(locale, "home.guides")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guide/${g.slug}`}
                className="group rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-sky-700 hover:bg-neutral-900/60"
              >
                <span className="font-medium group-hover:text-sky-400">
                  📖 {g.title}
                </span>
                <p className="mt-1 text-sm text-neutral-400">{g.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t(locale, "home.exercises")}
      </h2>
      {exercises.length === 0 && (
        <p className="mt-3 text-neutral-500">{t(locale, "home.noExercises")}</p>
      )}

      {[...byTopic.entries()].map(([topic, list]) => {
        const topicSolved = list.filter((e) => progress[e.id]?.solved).length;
        return (
          <section key={topic} className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {topicLabel(locale, topic)}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-normal normal-case ${
                  topicSolved === list.length
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {topicSolved}/{list.length}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((ex) => {
                const solved = !!progress[ex.id]?.solved;
                return (
                  <Link
                    key={ex.id}
                    href={`/exercise/${ex.id}`}
                    className={`group relative rounded-lg border p-4 transition ${
                      solved
                        ? "border-emerald-800 bg-emerald-950/30 hover:border-emerald-600"
                        : "border-neutral-800 bg-neutral-900 hover:border-emerald-700 hover:bg-neutral-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-medium ${solved ? "text-emerald-300" : "group-hover:text-emerald-400"}`}
                      >
                        {ex.title}
                      </span>
                      <span className="shrink-0 text-xs text-amber-400">
                        {"★".repeat(ex.difficulty)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-400">{ex.summary}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                      <span>
                        ~{ex.estimatedMinutes} {t(locale, "wb.min")}
                      </span>
                      <span>·</span>
                      <span>
                        {ex.points} {t(locale, "wb.pts")}
                      </span>
                      {solved && (
                        <span className="ml-auto rounded-full bg-emerald-900 px-2 py-0.5 font-medium text-emerald-300">
                          {t(locale, "wb.solved")}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
