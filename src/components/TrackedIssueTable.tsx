import type { TrackedIssueRow } from "@/db/schema";
import { getTrackedCategoryLabel } from "@/config/tracked-categories";
import { TrackedRemoveButton } from "@/components/TrackedRemoveButton";
import {
  daysOverdue,
  daysUntilDue,
  formatIssueDate,
  formatIssueDateTime,
  isOverdue,
} from "@/lib/issue-metrics";

export function TrackedIssueTable({ issues }: { issues: TrackedIssueRow[] }) {
  if (!issues.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
          <tr>
            <th className="px-4 py-3 font-medium">Ключ</th>
            <th className="px-4 py-3 font-medium">Категорія</th>
            <th className="px-4 py-3 font-medium">Тип в Jira</th>
            <th className="px-4 py-3 font-medium">Назва</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">Дедлайн</th>
            <th className="px-4 py-3 font-medium">Остання зміна</th>
            <th className="px-4 py-3 font-medium">Створено</th>
            <th className="px-4 py-3 font-medium">Прострочення</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const overdue = daysOverdue(issue.dueDate);
            const until = daysUntilDue(issue.dueDate);
            const stale =
              !issue.syncedAt ||
              (issue.summary === "" && issue.status === "—");

            return (
              <tr
                key={issue.key}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]"
              >
                <td className="px-4 py-3">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[var(--link)] hover:underline"
                  >
                    {issue.key}
                  </a>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                  {getTrackedCategoryLabel(issue.category)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                  {issue.issueType ?? "—"}
                </td>
                <td className="max-w-xs truncate px-4 py-3">
                  {stale ? (
                    <span className="text-[var(--text-muted)]">
                      Ще не синхронізовано
                    </span>
                  ) : (
                    issue.summary
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {issue.status}
                </td>
                <td className="px-4 py-3">{issue.dueDate ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatIssueDateTime(issue.jiraUpdated)}
                </td>
                <td className="px-4 py-3">
                  {formatIssueDate(issue.jiraCreated)}
                </td>
                <td className="px-4 py-3">
                  {issue.dueDate == null ? (
                    "—"
                  ) : isOverdue(issue.dueDate) ? (
                    <span className="font-medium text-[var(--danger)]">
                      {overdue} дн.
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">
                      за {until} дн.
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TrackedRemoveButton issueKey={issue.key} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
