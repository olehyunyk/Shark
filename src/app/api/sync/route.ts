import { NextResponse } from "next/server";

import { runJiraSync } from "@/lib/sync";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const board = searchParams.get("board") ?? undefined;

  try {
    const result = await runJiraSync(undefined, board ?? undefined);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
