import type { JiraIssueRow } from "@/db/schema";

export type TimeFilter =
  | "all"
  | "overdue"
  | "not_overdue"
  | "due_in_7"
  | "no_due";

export type SortDirection = "asc" | "desc";

export type SortKey =
  | "key"
  | "issue_type"
  | "summary"
  | "status"
  | "jira_created"
  | "due_date"
  | "overdue_days"
  | "priority";

export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  all: "Усі",
  overdue: "Прострочені",
  not_overdue: "Не прострочені",
  due_in_7: "≤ 7 днів до дедлайну",
  no_due: "Без дедлайну",
};

export const SORT_LABELS: Record<SortKey, string> = {
  key: "Ключ",
  issue_type: "Тип (команда)",
  summary: "Назва",
  status: "Статус",
  jira_created: "Створено",
  due_date: "Дедлайн",
  overdue_days: "Днів прострочення",
  priority: "Пріоритет",
};

export function defaultSortDirection(sort: SortKey): SortDirection {
  if (sort === "overdue_days" || sort === "jira_created") return "desc";
  return "asc";
}

function todayUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseDue(dueDate: string): Date {
  const [y, m, day] = dueDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function daysOverdue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = parseDue(dueDate);
  const today = todayUtc();
  const diff = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
}

export function daysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = parseDue(dueDate);
  const today = todayUtc();
  const diff = Math.floor(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

export function isOverdue(dueDate: string | null): boolean {
  const d = daysUntilDue(dueDate);
  return d !== null && d < 0;
}

export function isDueWithinDays(
  dueDate: string | null,
  days: number
): boolean {
  const d = daysUntilDue(dueDate);
  return d !== null && d >= 0 && d <= days;
}

export function matchesTimeFilter(
  issue: JiraIssueRow,
  filter: TimeFilter
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "overdue":
      return isOverdue(issue.dueDate);
    case "not_overdue":
      return issue.dueDate !== null && !isOverdue(issue.dueDate);
    case "due_in_7":
      return isDueWithinDays(issue.dueDate, 7);
    case "no_due":
      return issue.dueDate === null;
    default:
      return true;
  }
}

function cmpNullableDate(
  a: Date | null,
  b: Date | null,
  nullLast = true
): number {
  if (a === null && b === null) return 0;
  if (a === null) return nullLast ? 1 : -1;
  if (b === null) return nullLast ? -1 : 1;
  return a.getTime() - b.getTime();
}

export function formatIssueDate(value: Date | string | null): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatIssueDateTime(value: Date | string | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function cmpNullableNumber(
  a: number | null,
  b: number | null,
  nullLast = true
): number {
  if (a === null && b === null) return 0;
  if (a === null) return nullLast ? 1 : -1;
  if (b === null) return nullLast ? -1 : 1;
  return a - b;
}

function cmpNullableString(a: string | null, b: string | null): number {
  const sa = a ?? "";
  const sb = b ?? "";
  if (!sa && !sb) return 0;
  if (!sa) return 1;
  if (!sb) return -1;
  return sa.localeCompare(sb, "uk");
}

export function compareIssues(a: JiraIssueRow, b: JiraIssueRow, sort: SortKey) {
  switch (sort) {
    case "overdue_days": {
      const oa = daysOverdue(a.dueDate);
      const ob = daysOverdue(b.dueDate);
      const cmp = cmpNullableNumber(oa, ob);
      if (cmp !== 0) return cmp;
      return cmpNullableString(a.dueDate, b.dueDate);
    }
    case "due_date":
      return cmpNullableString(a.dueDate, b.dueDate);
    case "jira_created":
      return cmpNullableDate(a.jiraCreated, b.jiraCreated);
    case "issue_type": {
      const cmp = cmpNullableString(a.issueType, b.issueType);
      return cmp || a.key.localeCompare(b.key);
    }
    case "summary":
      return (
        cmpNullableString(a.summary, b.summary) ||
        a.key.localeCompare(b.key)
      );
    case "status":
      return (
        cmpNullableString(a.status, b.status) ||
        a.key.localeCompare(b.key)
      );
    case "priority":
      return (
        cmpNullableString(a.priority, b.priority) ||
        a.key.localeCompare(b.key)
      );
    case "key":
    default:
      return a.key.localeCompare(b.key);
  }
}

export function sortIssues(
  issues: JiraIssueRow[],
  sort: SortKey,
  direction: SortDirection
): JiraIssueRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...issues].sort(
    (a, b) => factor * compareIssues(a, b, sort)
  );
}

export function computeStats(issues: JiraIssueRow[]) {
  let overdue = 0;
  let noDue = 0;
  let dueIn7 = 0;
  const byType: Record<string, number> = {};

  for (const issue of issues) {
    if (!issue.dueDate) noDue++;
    else if (isOverdue(issue.dueDate)) overdue++;
    else if (isDueWithinDays(issue.dueDate, 7)) dueIn7++;

    const t = issue.issueType ?? "—";
    byType[t] = (byType[t] ?? 0) + 1;
  }

  return {
    total: issues.length,
    overdue,
    noDue,
    dueIn7,
    notOverdue: issues.length - overdue - noDue,
    byType,
  };
}

export function filterAndSortIssues(
  issues: JiraIssueRow[],
  opts: {
    timeFilter: TimeFilter;
    issueType: string;
    sort: SortKey;
    direction: SortDirection;
  }
): JiraIssueRow[] {
  let list = issues.filter((i) => matchesTimeFilter(i, opts.timeFilter));
  if (opts.issueType !== "all") {
    list = list.filter((i) => (i.issueType ?? "—") === opts.issueType);
  }
  return sortIssues(list, opts.sort, opts.direction);
}
