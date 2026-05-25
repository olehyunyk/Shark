import type { JiraIssueRow } from "@/db/schema";

export type TimeFilter =
  | "all"
  | "overdue"
  | "not_overdue"
  | "due_in_7"
  | "no_due";

export type SortKey =
  | "overdue_days"
  | "due_date"
  | "issue_type"
  | "key";

export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  all: "Усі",
  overdue: "Прострочені",
  not_overdue: "Не прострочені",
  due_in_7: "≤ 7 днів до дедлайну",
  no_due: "Без дедлайну",
};

export const SORT_LABELS: Record<SortKey, string> = {
  overdue_days: "Днів прострочення",
  due_date: "Дедлайн",
  issue_type: "Тип (команда)",
  key: "Ключ",
};

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

export function compareIssues(a: JiraIssueRow, b: JiraIssueRow, sort: SortKey) {
  switch (sort) {
    case "overdue_days": {
      const oa = daysOverdue(a.dueDate) ?? -1;
      const ob = daysOverdue(b.dueDate) ?? -1;
      if (ob !== oa) return ob - oa;
      return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    }
    case "due_date": {
      const da = a.dueDate ?? "9999-99-99";
      const db = b.dueDate ?? "9999-99-99";
      return da.localeCompare(db);
    }
    case "issue_type": {
      const ta = a.issueType ?? "—";
      const tb = b.issueType ?? "—";
      return ta.localeCompare(tb) || a.key.localeCompare(b.key);
    }
    case "key":
    default:
      return a.key.localeCompare(b.key);
  }
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
  }
): JiraIssueRow[] {
  let list = issues.filter((i) => matchesTimeFilter(i, opts.timeFilter));
  if (opts.issueType !== "all") {
    list = list.filter((i) => (i.issueType ?? "—") === opts.issueType);
  }
  return [...list].sort((a, b) => compareIssues(a, b, opts.sort));
}
