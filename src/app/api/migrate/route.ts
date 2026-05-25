import { NextResponse } from "next/server";

import { assertCronSecret } from "@/lib/auth";
import { runSchemaMigration, verifySchema } from "@/lib/migrate-schema";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    assertCronSecret(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  try {
    const applied = await runSchemaMigration();
    const verification = await verifySchema();
    return NextResponse.json({ ok: true, applied, verification });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Migration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    assertCronSecret(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  try {
    const verification = await verifySchema();
    return NextResponse.json(verification);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
