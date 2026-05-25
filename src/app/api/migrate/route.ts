import { NextResponse } from "next/server";

import { runSchemaMigration, verifySchema } from "@/lib/migrate-schema";

export const maxDuration = 30;

export async function POST() {
  try {
    const applied = await runSchemaMigration();
    const verification = await verifySchema();
    return NextResponse.json({ ok: true, applied, verification });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Migration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json(await verifySchema());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
