import { NextResponse } from "next/server";

import { probeJiraSearch } from "@/lib/jira";
import { getActiveJql } from "@/lib/settings";

export const maxDuration = 60;

export async function GET(request: Request) {
  const board = new URL(request.url).searchParams.get("board") ?? undefined;

  try {
    const jql = await getActiveJql(board ?? undefined);
    return NextResponse.json(await probeJiraSearch(jql, board ?? undefined));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Jira probe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
