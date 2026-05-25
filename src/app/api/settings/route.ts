import { NextResponse } from "next/server";

import { getJqlSettings, setActiveJql } from "@/lib/settings";

export async function GET(request: Request) {
  const board = new URL(request.url).searchParams.get("board") ?? undefined;
  try {
    return NextResponse.json(await getJqlSettings(board ?? undefined));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { jql?: string };
    if (!body.jql?.trim()) {
      return NextResponse.json({ error: "jql is required" }, { status: 400 });
    }
    await setActiveJql(body.jql);
    const board = new URL(request.url).searchParams.get("board") ?? undefined;
    return NextResponse.json(await getJqlSettings(board ?? undefined));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
