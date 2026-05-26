import { NextResponse } from "next/server";

import { runTrackedSync } from "@/lib/tracked-sync";

export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runTrackedSync();
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
