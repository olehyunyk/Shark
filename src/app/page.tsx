import { getDefaultBoard } from "@/config/jira-boards";
import { getDb, schema } from "@/db";
import { IssueTable } from "@/components/IssueTable";
import { SyncButton } from "@/components/SyncButton";
import { buildReport, BUCKET_ORDER } from "@/lib/report";
import { getLastSync } from "@/lib/sync";

const board = getDefaultBoard();

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let issues: (typeof schema.jiraIssues.$inferSelect)[] = [];
  let lastSync: Awaited<ReturnType<typeof getLastSync>> = null;
  let dbError: string | null = null;

  try {
    const db = getDb();
    issues = await db.select().from(schema.jiraIssues);
    lastSync = await getLastSync();
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database error";
  }

  const report = buildReport(issues);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Звіт по дедлайнах
          </h1>
          <p className="mt-1 text-slate-400">
            <a
              href={board.boardUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline"
            >
              {board.name}
            </a>
            {" · "}всього задач: {report.total}
          </p>
          {lastSync && (
            <p className="mt-1 text-xs text-slate-500">
              Остання синхронізація:{" "}
              {lastSync.finishedAt?.toLocaleString("uk-UA") ?? "—"} ·{" "}
              {lastSync.status === "success"
                ? `${lastSync.issueCount} задач`
                : lastSync.status}
              {lastSync.jql && (
                <>
                  <br />
                  JQL: <code className="text-slate-400">{lastSync.jql}</code>
                </>
              )}
              {lastSync.errorMessage && (
                <>
                  <br />
                  <span className="text-amber-400">{lastSync.errorMessage}</span>
                </>
              )}
            </p>
          )}
        </div>
        <SyncButton boardId={board.id} />
      </header>

      {dbError && (
        <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/50 px-4 py-3 text-amber-200">
          {dbError}. Перевірте DATABASE_URL і виконайте міграцію (
          <code className="text-sm">npm run db:migrate</code>).
        </div>
      )}

      {report.total === 0 && !dbError && (
        <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center text-slate-400">
          Немає даних. Натисніть «Оновити з Jira».
          <p className="mt-3 text-xs text-slate-500">
            Проєкт <strong>{board.projectKey}</strong> · JQL:{" "}
            <code>{board.jql}</code>
          </p>
        </div>
      )}

      {BUCKET_ORDER.map((bucket) => (
        <IssueTable
          key={bucket}
          bucket={bucket}
          issues={report.buckets[bucket]}
        />
      ))}

      {report.total > 0 && (
        <footer className="mt-8 grid gap-6 sm:grid-cols-2">
          <StatsCard title="За статусом" data={report.byStatus} />
          <StatsCard title="За пріоритетом" data={report.byPriority} />
        </footer>
      )}
    </main>
  );
}

function StatsCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <h3 className="mb-3 font-semibold text-slate-300">{title}</h3>
      <ul className="space-y-1 text-sm text-slate-400">
        {entries.map(([label, count]) => (
          <li key={label} className="flex justify-between">
            <span>{label}</span>
            <span>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
