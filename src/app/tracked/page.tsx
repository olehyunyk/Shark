import { TrackedDashboard } from "@/components/TrackedDashboard";
import { getDb, schema } from "@/db";
import { getLastTrackedSync } from "@/lib/tracked-sync";

export const dynamic = "force-dynamic";

export default async function TrackedPage() {
  let issues: (typeof schema.trackedIssues.$inferSelect)[] = [];
  let lastSyncLabel: string | null = null;
  let dbError: string | null = null;

  try {
    const db = getDb();
    issues = await db
      .select()
      .from(schema.trackedIssues)
      .orderBy(schema.trackedIssues.key);

    const lastSync = await getLastTrackedSync();
    if (lastSync) {
      const when = lastSync.finishedAt?.toLocaleString("uk-UA") ?? "—";
      const count =
        lastSync.status === "success"
          ? `${lastSync.issueCount} оновлено`
          : lastSync.status;
      lastSyncLabel = `Остання синхронізація: ${when} · ${count}`;
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
        <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-4 py-3 text-[var(--error-text)]">
          {dbError}
          {dbError.includes("tracked_issues") && (
            <p className="mt-2 text-sm">
              Потрібна міграція БД. Передеплойте або викличте POST /api/migrate.
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <TrackedDashboard issues={issues} lastSyncLabel={lastSyncLabel} />
    </main>
  );
}
