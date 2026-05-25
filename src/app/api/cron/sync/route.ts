import { NextResponse } from "next/server";

import { runJiraSync } from "@/lib/sync";

export const maxDuration = 60;

/** Vercel Cron — кожні 5 хв (vercel.json). */
export async function GET() {
  try {
    const result = await runJiraSync();
    return NextResponse.json({ cron: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
