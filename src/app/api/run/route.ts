import { NextResponse } from "next/server";
import { loadExercise } from "@/lib/exercises";
import { gradeBash } from "@/lib/executor/bash";
import type { SubmittedFile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RunBody {
  id: string;
  files: SubmittedFile[];
}

export async function POST(req: Request) {
  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.id || !Array.isArray(body.files)) {
    return NextResponse.json(
      { error: "expected { id, files[] }" },
      { status: 400 },
    );
  }

  let manifest;
  try {
    ({ manifest } = await loadExercise(body.id));
  } catch {
    return NextResponse.json(
      { error: `unknown exercise: ${body.id}` },
      { status: 404 },
    );
  }

  switch (manifest.kind) {
    case "bash": {
      const result = await gradeBash({
        id: manifest.id,
        entrypoint: manifest.entrypoint,
        points: manifest.points,
        files: body.files,
        lint: manifest.lint,
        lintExclude: manifest.lintExclude,
      });
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json(
        { error: `kind '${manifest.kind}' not implemented yet` },
        { status: 501 },
      );
  }
}
