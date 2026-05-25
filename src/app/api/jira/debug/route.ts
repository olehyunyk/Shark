import { NextResponse } from "next/server";

import { assertCronSecret } from "@/lib/auth";
import { probeJiraSearch } from "@/lib/jira";

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    assertCronSecret(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  try {
    const result = await probeJiraSearch();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Jira probe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
