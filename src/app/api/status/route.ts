import { NextResponse } from "next/server";

import { getDefaultBoard } from "@/config/jira-boards";
import { getDb, schema } from "@/db";
import { getJqlSettings } from "@/lib/settings";
import { getLastSync } from "@/lib/sync";
import { computeStats } from "@/lib/issue-metrics";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(schema.jiraIssues);
    const lastSync = await getLastSync();
    const board = getDefaultBoard();
    const jql = await getJqlSettings();
    const stats = computeStats(rows);

    return NextResponse.json({
      issuesInDb: rows.length,
      stats,
      board: {
        id: board.id,
        name: board.name,
        boardUrl: board.boardUrl,
      },
      jql,
      lastSync: lastSync
        ? {
            status: lastSync.status,
            issueCount: lastSync.issueCount,
            jql: lastSync.jql,
            finishedAt: lastSync.finishedAt,
            errorMessage: lastSync.errorMessage,
          }
        : null,
      hasJira: Boolean(
        process.env.JIRA_EMAIL?.trim() && process.env.JIRA_API_TOKEN?.trim()
      ),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
