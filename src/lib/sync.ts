import { desc, eq, lt } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { fetchJiraIssues } from "@/lib/jira";
import { getActiveJql } from "@/lib/settings";

export async function runJiraSync(jql?: string, boardId?: string) {
  const db = getDb();
  const query = jql?.trim() || (await getActiveJql(boardId));
  const startedAt = new Date();

  const [run] = await db
    .insert(schema.syncRuns)
    .values({ status: "running", jql: query })
    .returning();

  try {
    const issues = await fetchJiraIssues(query, 1000, boardId);
    const syncStamp = new Date();

    for (const issue of issues) {
      try {
        await db
          .insert(schema.jiraIssues)
          .values({
            key: issue.key,
            summary: issue.summary,
            status: issue.status,
            issueType: issue.issueType,
            assignee: issue.assignee,
            priority: issue.priority,
            dueDate: issue.dueDate,
            jiraCreated: issue.jiraCreated
              ? new Date(issue.jiraCreated)
              : null,
            jiraUpdated: issue.jiraUpdated ? new Date(issue.jiraUpdated) : null,
            url: issue.url,
            syncedAt: syncStamp,
          })
          .onConflictDoUpdate({
            target: schema.jiraIssues.key,
            set: {
              summary: issue.summary,
              status: issue.status,
              issueType: issue.issueType,
              assignee: issue.assignee,
              priority: issue.priority,
              dueDate: issue.dueDate,
              jiraCreated: issue.jiraCreated
                ? new Date(issue.jiraCreated)
                : null,
              jiraUpdated: issue.jiraUpdated ? new Date(issue.jiraUpdated) : null,
              url: issue.url,
              syncedAt: syncStamp,
            },
          });
      } catch (rowErr) {
        const msg = rowErr instanceof Error ? rowErr.message : String(rowErr);
        if (msg.includes("issue_type") || msg.includes("column")) {
          throw new Error(
            "DB schema outdated (missing issue_type). Redeploy or run /api/migrate POST."
          );
        }
        throw rowErr;
      }
    }

    await db
      .delete(schema.jiraIssues)
      .where(lt(schema.jiraIssues.syncedAt, startedAt));

    await db
      .update(schema.syncRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        issueCount: issues.length,
      })
      .where(eq(schema.syncRuns.id, run.id));

    return {
      ok: true as const,
      count: issues.length,
      runId: run.id,
      jql: query,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.syncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(schema.syncRuns.id, run.id));
    throw err;
  }
}

export async function getLastSync(): Promise<
  typeof schema.syncRuns.$inferSelect | null
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.syncRuns)
    .orderBy(desc(schema.syncRuns.startedAt))
    .limit(1);
  return rows[0] ?? null;
}
