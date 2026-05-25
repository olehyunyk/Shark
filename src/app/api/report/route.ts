import { NextResponse } from "next/server";

import { getDb, schema } from "@/db";
import { buildReport } from "@/lib/report";

export async function GET() {
  try {
    const db = getDb();
    const issues = await db.select().from(schema.jiraIssues);
    const report = buildReport(issues);
    return NextResponse.json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
