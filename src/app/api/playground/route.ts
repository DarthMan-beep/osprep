import { NextResponse } from "next/server";
import { runPlayground } from "@/lib/executor/playground";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  code: string;
  stdin?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof body.code !== "string") {
    return NextResponse.json({ error: "expected { code }" }, { status: 400 });
  }
  const result = await runPlayground(
    body.code,
    typeof body.stdin === "string" ? body.stdin : undefined,
  );
  return NextResponse.json(result);
}
