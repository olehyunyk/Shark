import type { JiraIssueRow } from "@/db/schema";

export type DeadlineBucket =
  | "overdue"
  | "today"
  | "this_week"
  | "later"
  | "no_due";

export const BUCKET_LABELS: Record<DeadlineBucket, string> = {
  overdue: "Прострочені",
  today: "Дедлайн сьогодні",
  this_week: "Цей тиждень",
  later: "Пізніше",
  no_due: "Без дедлайну",
};

export const BUCKET_ORDER: DeadlineBucket[] = [
  "overdue",
  "today",
  "this_week",
  "later",
  "no_due",
];

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function weekEndIso(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10);
}

export function getBucket(dueDate: string | null): DeadlineBucket {
  if (!dueDate) return "no_due";
  const today = todayIso();
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  if (dueDate <= weekEndIso()) return "this_week";
  return "later";
}

export type ReportData = {
  total: number;
  buckets: Record<DeadlineBucket, JiraIssueRow[]>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
};

export function buildReport(issues: JiraIssueRow[]): ReportData {
  const buckets: Record<DeadlineBucket, JiraIssueRow[]> = {
    overdue: [],
    today: [],
    this_week: [],
    later: [],
    no_due: [],
  };

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const issue of issues) {
    const bucket = getBucket(issue.dueDate);
    buckets[bucket].push(issue);
    byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
    const p = issue.priority ?? "—";
    byPriority[p] = (byPriority[p] ?? 0) + 1;
  }

  for (const key of BUCKET_ORDER) {
    buckets[key].sort((a, b) => {
      const da = a.dueDate ?? "9999-99-99";
      const db = b.dueDate ?? "9999-99-99";
      return da.localeCompare(db) || a.key.localeCompare(b.key);
    });
  }

  return { total: issues.length, buckets, byStatus, byPriority };
}
