import { NextResponse } from "next/server";

import { getDefaultBoard } from "@/config/jira-boards";
import { getDb, schema } from "@/db";
import { getJiraConfig } from "@/lib/jira";
import { getLastSync } from "@/lib/sync";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(schema.jiraIssues);
    const lastSync = await getLastSync();
    const board = getDefaultBoard();

    let activeJql = board.jql;
    let hasJira = false;
    try {
      const cfg = getJiraConfig();
      activeJql = cfg.jql;
      hasJira = true;
    } catch {
      /* credentials missing */
    }

    return NextResponse.json({
      issuesInDb: rows.length,
      board: {
        id: board.id,
        name: board.name,
        boardUrl: board.boardUrl,
        projectKey: board.projectKey,
      },
      lastSync: lastSync
        ? {
            status: lastSync.status,
            issueCount: lastSync.issueCount,
            jql: lastSync.jql,
            finishedAt: lastSync.finishedAt,
            errorMessage: lastSync.errorMessage,
          }
        : null,
      config: { activeJql, hasJiraEmail: hasJira, hasJiraToken: hasJira },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
