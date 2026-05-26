import { NextResponse } from "next/server";

import { isTrackedCategory } from "@/config/tracked-categories";
import { getDb, schema } from "@/db";
import { normalizeJiraKey } from "@/lib/jira";
import { addTrackedIssue, removeTrackedIssue } from "@/lib/tracked-sync";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.trackedIssues)
      .orderBy(schema.trackedIssues.key);
    return NextResponse.json({ issues: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      key?: string;
      category?: string;
    };
    const key = normalizeJiraKey(body.key ?? "");
    if (!key) {
      return NextResponse.json(
        { error: "Невірний ключ. Приклад: MK-123 або PROJ-45" },
        { status: 400 }
      );
    }
    if (!body.category || !isTrackedCategory(body.category)) {
      return NextResponse.json(
        { error: "Оберіть тип: Business Feature або Product request" },
        { status: 400 }
      );
    }

    const issue = await addTrackedIssue(key, body.category);
    return NextResponse.json({ issue });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = normalizeJiraKey(searchParams.get("key") ?? "");
  if (!key) {
    return NextResponse.json({ error: "Невірний ключ" }, { status: 400 });
  }

  try {
    await removeTrackedIssue(key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
