import { notFound } from "next/navigation";
import { loadExercise } from "@/lib/exercises";
import { readEntry } from "@/lib/progress";
import { getLocale } from "@/lib/locale.server";
import { renderMarkdown } from "@/lib/markdown";
import { Workbench } from "@/components/Workbench";

export const dynamic = "force-dynamic";

/** Markdown fence language for a provided file, by extension. */
function fenceLang(name: string): string {
  if (/\.py$/i.test(name)) return "python";
  if (/\.java$/i.test(name)) return "java";
  if (/\.sh$/i.test(name)) return "bash";
  if (/\.json$/i.test(name)) return "json";
  if (/\.ya?ml$/i.test(name)) return "yaml";
  if (/^Dockerfile/i.test(name)) return "dockerfile";
  return "text";
}

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id } = await params;
  const exerciseId = id.join("/");
  const locale = await getLocale();

  let exercise;
  try {
    exercise = await loadExercise(exerciseId, locale);
  } catch {
    notFound();
  }

  const saved = await readEntry(exerciseId);
  const problemHtml = await renderMarkdown(exercise.problemMarkdown);

  let providedHtml = "";
  if (exercise.providedFiles.length > 0) {
    const md = exercise.providedFiles
      .map((f) => `##### \`${f.name}\`\n\n\`\`\`${fenceLang(f.name)}\n${f.content}\n\`\`\``)
      .join("\n\n");
    providedHtml = await renderMarkdown(md);
  }

  return (
    <Workbench
      exercise={exercise}
      problemHtml={problemHtml}
      providedHtml={providedHtml}
      savedCode={saved?.code}
      alreadySolved={saved?.solved}
      locale={locale}
    />
  );
}
