import { notFound } from "next/navigation";
import { loadExercise } from "@/lib/exercises";
import { readEntry } from "@/lib/progress";
import { getLocale } from "@/lib/locale.server";
import { Workbench } from "@/components/Workbench";

export const dynamic = "force-dynamic";

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

  return (
    <Workbench
      exercise={exercise}
      savedCode={saved?.code}
      alreadySolved={saved?.solved}
      locale={locale}
    />
  );
}
