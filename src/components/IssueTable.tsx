import type { JiraIssueRow } from "@/db/schema";
import {
  daysOverdue,
  daysUntilDue,
  isOverdue,
} from "@/lib/issue-metrics";

export function IssueTable({
  issues,
  title,
}: {
  issues: JiraIssueRow[];
  title?: string;
}) {
  if (!issues.length) return null;

  return (
    <section className="mb-8">
      {title && (
        <h2 className="mb-3 text-lg font-semibold text-indigo-300">
          {title}{" "}
          <span className="text-slate-500">({issues.length})</span>
        </h2>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Ключ</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Назва</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дедлайн</th>
              <th className="px-4 py-3">Прострочення</th>
              <th className="px-4 py-3">Пріоритет</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const overdue = daysOverdue(issue.dueDate);
              const until = daysUntilDue(issue.dueDate);
              return (
                <tr
                  key={issue.key}
                  className="border-t border-slate-800 hover:bg-slate-900/50"
                >
                  <td className="px-4 py-3">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-400 hover:underline"
                    >
                      {issue.key}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {issue.issueType ?? "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3">
                    {issue.summary}
                  </td>
                  <td className="px-4 py-3">{issue.status}</td>
                  <td className="px-4 py-3">{issue.dueDate ?? "—"}</td>
                  <td className="px-4 py-3">
                    {issue.dueDate == null ? (
                      "—"
                    ) : isOverdue(issue.dueDate) ? (
                      <span className="text-red-400">
                        {overdue} дн.
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        за {until} дн.
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{issue.priority ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
