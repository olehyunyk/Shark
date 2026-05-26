import type { JiraIssueRow } from "@/db/schema";
import {
  daysOverdue,
  daysUntilDue,
  formatIssueDate,
  isOverdue,
  type SortDirection,
  type SortKey,
} from "@/lib/issue-metrics";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "key", label: "Ключ" },
  { key: "issue_type", label: "Тип" },
  { key: "summary", label: "Назва" },
  { key: "status", label: "Статус" },
  { key: "jira_created", label: "Створено" },
  { key: "due_date", label: "Дедлайн" },
  { key: "overdue_days", label: "Прострочення" },
  { key: "priority", label: "Пріоритет" },
];

export function IssueTable({
  issues,
  title,
  sortKey,
  sortDirection,
  onSort,
}: {
  issues: JiraIssueRow[];
  title?: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  if (!issues.length) return null;

  return (
    <section className="mb-8">
      {title && (
        <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">
          {title}{" "}
          <span className="text-[var(--text-muted)]">({issues.length})</span>
        </h2>
      )}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
            <tr>
              {COLUMNS.map((col) => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  active={sortKey === col.key}
                  direction={sortDirection}
                  onClick={() => onSort(col.key)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const overdue = daysOverdue(issue.dueDate);
              const until = daysUntilDue(issue.dueDate);
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
                    {issue.issueType ?? "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3">
                    {issue.summary}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {issue.status}
                  </td>
                  <td className="px-4 py-3">
                    {formatIssueDate(issue.jiraCreated)}
                  </td>
                  <td className="px-4 py-3">{issue.dueDate ?? "—"}</td>
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
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {issue.priority ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex w-full items-center gap-1 text-left hover:text-[var(--text)]"
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span>{label}</span>
        <span
          className={`inline-flex flex-col text-[10px] leading-none ${
            active
              ? "text-[var(--text)]"
              : "text-[var(--text-muted)] opacity-0 group-hover:opacity-60"
          }`}
          aria-hidden
        >
          <span className={active && direction === "asc" ? "" : "opacity-30"}>
            ▲
          </span>
          <span
            className={`-mt-0.5 ${active && direction === "desc" ? "" : "opacity-30"}`}
          >
            ▼
          </span>
        </span>
      </button>
    </th>
  );
}
