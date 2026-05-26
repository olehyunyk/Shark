import { desc, eq } from "drizzle-orm";

import { JIRA_SITE_URL } from "@/config/jira-boards";
import { getDb, schema } from "@/db";
import { fetchJiraIssuesByKeys } from "@/lib/jira";

export async function runTrackedSync() {
  const db = getDb();
  const rows = await db
    .select({ key: schema.trackedIssues.key })
    .from(schema.trackedIssues);

  const keys = rows.map((r) => r.key);
  const [run] = await db
    .insert(schema.trackedSyncRuns)
    .values({ status: "running" })
    .returning();

  if (keys.length === 0) {
    await db
      .update(schema.trackedSyncRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        issueCount: 0,
      })
      .where(eq(schema.trackedSyncRuns.id, run.id));
    return { ok: true as const, count: 0, runId: run.id };
  }

  try {
    const issues = await fetchJiraIssuesByKeys(keys);
    const byKey = new Map(issues.map((i) => [i.key.toUpperCase(), i]));
    const syncStamp = new Date();
    let updated = 0;

    for (const key of keys) {
      const issue = byKey.get(key.toUpperCase());
      if (!issue) continue;

      await db
        .update(schema.trackedIssues)
        .set({
          summary: issue.summary,
          status: issue.status,
          issueType: issue.issueType,
          assignee: issue.assignee,
          priority: issue.priority,
          dueDate: issue.dueDate,
          jiraCreated: issue.jiraCreated
            ? new Date(issue.jiraCreated)
            : null,
          jiraUpdated: issue.jiraUpdated
            ? new Date(issue.jiraUpdated)
            : null,
          url: issue.url,
          syncedAt: syncStamp,
        })
        .where(eq(schema.trackedIssues.key, key));

      updated++;
    }

    await db
      .update(schema.trackedSyncRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        issueCount: updated,
      })
      .where(eq(schema.trackedSyncRuns.id, run.id));

    const missing = keys.length - updated;
    return {
      ok: true as const,
      count: updated,
      missing,
      runId: run.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.trackedSyncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(schema.trackedSyncRuns.id, run.id));
    throw err;
  }
}

export async function addTrackedIssue(
  key: string,
  category: string
): Promise<typeof schema.trackedIssues.$inferSelect> {
  const db = getDb();
  const normalized = key.trim().toUpperCase();
  const url = `${JIRA_SITE_URL}/browse/${normalized}`;

  const [row] = await db
    .insert(schema.trackedIssues)
    .values({
      key: normalized,
      category,
      summary: "",
      status: "—",
      url,
    })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    const existing = await db
      .select()
      .from(schema.trackedIssues)
      .where(eq(schema.trackedIssues.key, normalized))
      .limit(1);
    if (existing[0]) return existing[0];
    throw new Error("Не вдалося додати задачу");
  }

  await runTrackedSync();
  const refreshed = await db
    .select()
    .from(schema.trackedIssues)
    .where(eq(schema.trackedIssues.key, normalized))
    .limit(1);
  return refreshed[0] ?? row;
}

export async function removeTrackedIssue(key: string) {
  const db = getDb();
  const normalized = key.trim().toUpperCase();
  await db
    .delete(schema.trackedIssues)
    .where(eq(schema.trackedIssues.key, normalized));
}

export async function getLastTrackedSync(): Promise<
  typeof schema.trackedSyncRuns.$inferSelect | null
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.trackedSyncRuns)
    .orderBy(desc(schema.trackedSyncRuns.startedAt))
    .limit(1);
  return rows[0] ?? null;
}
