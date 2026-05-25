import { NextResponse } from "next/server";

import { probeJiraSearch } from "@/lib/jira";

export const maxDuration = 60;

export async function GET(request: Request) {
  const board = new URL(request.url).searchParams.get("board") ?? undefined;

  try {
    return NextResponse.json(await probeJiraSearch(board ?? undefined));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Jira probe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
