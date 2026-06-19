import { NextResponse } from "next/server";
import { readProgress, upsertProgress, removeEntry } from "@/lib/progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readProgress());
}

interface SaveBody {
  id: string;
  code?: string;
  solved?: boolean;
  score?: number;
  maxScore?: number;
}

export async function POST(req: Request) {
  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const entry = await upsertProgress(body.id, {
    code: body.code,
    solved: body.solved,
    bestScore: body.score,
    maxScore: body.maxScore,
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: Request) {
  let body: { id?: string };
  try {
    body = (await req.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await removeEntry(body.id);
  return NextResponse.json({ ok: true });
}
