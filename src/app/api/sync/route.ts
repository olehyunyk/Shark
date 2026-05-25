import { NextResponse } from "next/server";

import { assertCronSecret } from "@/lib/auth";
import { runJiraSync } from "@/lib/sync";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertCronSecret(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  try {
    const result = await runJiraSync();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
