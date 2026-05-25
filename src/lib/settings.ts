import { eq } from "drizzle-orm";

import { getBoard, getDefaultBoard } from "@/config/jira-boards";
import { getDb, schema } from "@/db";

const JQL_KEY = "jql";

/** JQL: з БД (UI) → default борди. Env JIRA_JQL не використовується. */
export async function getActiveJql(boardId?: string): Promise<string> {
  const board = boardId ? getBoard(boardId) : getDefaultBoard();
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, JQL_KEY))
      .limit(1);
    const stored = rows[0]?.value?.trim();
    if (stored) return stored;
  } catch {
    /* DB unavailable */
  }
  return board.jql;
}

export async function setActiveJql(jql: string): Promise<void> {
  const trimmed = jql.trim();
  if (!trimmed) throw new Error("JQL cannot be empty");
  const db = getDb();
  await db
    .insert(schema.appSettings)
    .values({ key: JQL_KEY, value: trimmed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.appSettings.key,
      set: { value: trimmed, updatedAt: new Date() },
    });
}

export async function getJqlSettings(boardId?: string) {
  const board = boardId ? getBoard(boardId) : getDefaultBoard();
  const active = await getActiveJql(boardId);
  return {
    activeJql: active,
    defaultJql: board.jql,
    isCustom: active !== board.jql,
  };
}
