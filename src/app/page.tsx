import { getDefaultBoard } from "@/config/jira-boards";
import { Dashboard } from "@/components/Dashboard";
import { getDb, schema } from "@/db";
import { getJqlSettings } from "@/lib/settings";
import { getLastSync } from "@/lib/sync";

const board = getDefaultBoard();

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let issues: (typeof schema.jiraIssues.$inferSelect)[] = [];
  let lastSyncLabel: string | null = null;
  let dbError: string | null = null;
  let activeJql = board.jql;
  let defaultJql = board.jql;

  try {
    const db = getDb();
    issues = await db.select().from(schema.jiraIssues);
    const lastSync = await getLastSync();
    const jqlSettings = await getJqlSettings(board.id);
    activeJql = jqlSettings.activeJql;
    defaultJql = jqlSettings.defaultJql;

    if (lastSync) {
      const when = lastSync.finishedAt?.toLocaleString("uk-UA") ?? "—";
      const count =
        lastSync.status === "success"
          ? `${lastSync.issueCount} задач`
          : lastSync.status;
      lastSyncLabel = `Остання синхронізація: ${when} · ${count}`;
      if (lastSync.jql) lastSyncLabel += ` · JQL: ${lastSync.jql}`;
      if (lastSync.errorMessage) {
        lastSyncLabel += ` · Помилка: ${lastSync.errorMessage}`;
      }
    }
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database error";
  }

  if (dbError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-amber-800 bg-amber-950/50 px-4 py-3 text-amber-200">
          {dbError}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Dashboard
        issues={issues}
        boardId={board.id}
        boardName={board.name}
        boardUrl={board.boardUrl}
        activeJql={activeJql}
        defaultJql={defaultJql}
        lastSyncLabel={lastSyncLabel}
      />
    </main>
  );
}
