import { NextResponse } from "next/server";

import { getDb, schema } from "@/db";
import { DEFAULT_JQL, getJiraConfig, normalizeJiraBaseUrl } from "@/lib/jira";
import { getLastSync } from "@/lib/sync";

export async function GET() {
  try {
    const db = getDb();
    const count = await db.select().from(schema.jiraIssues);
    const lastSync = await getLastSync();

    let jiraBaseUrl = "";
    let activeJql = DEFAULT_JQL;
    try {
      const cfg = getJiraConfig();
      jiraBaseUrl = cfg.baseUrl;
      activeJql = cfg.jql;
    } catch {
      jiraBaseUrl = normalizeJiraBaseUrl(
        process.env.JIRA_BASE_URL?.trim() || ""
      );
      activeJql = process.env.JIRA_JQL?.trim() || DEFAULT_JQL;
    }

    return NextResponse.json({
      issuesInDb: count.length,
      lastSync: lastSync
        ? {
            status: lastSync.status,
            issueCount: lastSync.issueCount,
            jql: lastSync.jql,
            finishedAt: lastSync.finishedAt,
            errorMessage: lastSync.errorMessage,
          }
        : null,
      config: {
        jiraBaseUrl: jiraBaseUrl || null,
        activeJql,
        hasJiraEmail: Boolean(process.env.JIRA_EMAIL?.trim()),
        hasJiraToken: Boolean(process.env.JIRA_API_TOKEN?.trim()),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
