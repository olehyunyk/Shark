import type { JiraIssueRow } from "@/db/schema";
import type { DeadlineBucket } from "@/lib/report";
import { BUCKET_LABELS } from "@/lib/report";

export function IssueTable({
  bucket,
  issues,
}: {
  bucket: DeadlineBucket;
  issues: JiraIssueRow[];
}) {
  if (!issues.length) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-indigo-300">
        {BUCKET_LABELS[bucket]}{" "}
        <span className="text-slate-500">({issues.length})</span>
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Ключ</th>
              <th className="px-4 py-3">Назва</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дедлайн</th>
              <th className="px-4 py-3">Пріоритет</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
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
                <td className="max-w-md truncate px-4 py-3">{issue.summary}</td>
                <td className="px-4 py-3">{issue.status}</td>
                <td className="px-4 py-3">{issue.dueDate ?? "—"}</td>
                <td className="px-4 py-3">{issue.priority ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
