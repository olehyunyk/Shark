"use client";

import { useMemo, useState } from "react";

import type { JiraIssueRow } from "@/db/schema";
import { IssueTable } from "@/components/IssueTable";
import { AutoSync } from "@/components/AutoSync";
import { SyncButton } from "@/components/SyncButton";
import {
  computeStats,
  defaultSortDirection,
  filterAndSortIssues,
  SORT_LABELS,
  TIME_FILTER_LABELS,
  type SortDirection,
  type SortKey,
  type TimeFilter,
} from "@/lib/issue-metrics";

type Props = {
  issues: JiraIssueRow[];
  boardId: string;
  boardName: string;
  boardUrl: string;
  activeJql: string;
  defaultJql: string;
  lastSyncLabel: string | null;
};

export function Dashboard({
  issues,
  boardId,
  boardName,
  boardUrl,
  activeJql,
  defaultJql,
  lastSyncLabel,
}: Props) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [issueType, setIssueType] = useState("all");
  const [sort, setSort] = useState<SortKey>("overdue_days");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  function handleSort(key: SortKey) {
    if (key === sort) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDirection(defaultSortDirection(key));
    }
  }

  function handleSortDropdown(key: SortKey) {
    setSort(key);
    setSortDirection(defaultSortDirection(key));
  }
  const [jql, setJql] = useState(activeJql);
  const [jqlSaving, setJqlSaving] = useState(false);
  const [jqlMsg, setJqlMsg] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(issues), [issues]);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const i of issues) set.add(i.issueType ?? "—");
    return ["all", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [issues]);

  const filtered = useMemo(
    () =>
      filterAndSortIssues(issues, {
        timeFilter,
        issueType,
        sort,
        direction: sortDirection,
      }),
    [issues, timeFilter, issueType, sort, sortDirection]
  );

  async function saveJql() {
    setJqlSaving(true);
    setJqlMsg(null);
    try {
      const res = await fetch(`/api/settings?board=${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");
      setJqlMsg("JQL збережено. Запустіть синхронізацію.");
      setJql(data.activeJql);
    } catch (e) {
      setJqlMsg(e instanceof Error ? e.message : "Помилка");
    } finally {
      setJqlSaving(false);
    }
  }

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Звіт по дедлайнах
          </h1>
          <p className="mt-1 text-slate-400">
            <a
              href={boardUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline"
            >
              {boardName}
            </a>
            {" · "}показано {filtered.length} з {stats.total}
          </p>
          {lastSyncLabel && (
            <p className="mt-1 text-xs text-slate-500">{lastSyncLabel}</p>
          )}
          <AutoSync boardId={boardId} />
        </div>
        <SyncButton boardId={boardId} />
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Усього" value={stats.total} />
        <StatCard label="Прострочені" value={stats.overdue} accent="red" />
        <StatCard label="Не прострочені" value={stats.notOverdue} />
        <StatCard label="≤ 7 днів" value={stats.dueIn7} accent="amber" />
        <StatCard label="Без дедлайну" value={stats.noDue} />
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          JQL (зберігається в БД, не в .env)
        </label>
        <textarea
          value={jql}
          onChange={(e) => setJql(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-200"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveJql}
            disabled={jqlSaving}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
          >
            {jqlSaving ? "Збереження…" : "Зберегти JQL"}
          </button>
          <button
            type="button"
            onClick={() => setJql(defaultJql)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Скинути до default
          </button>
          {jqlMsg && <span className="text-sm text-slate-400">{jqlMsg}</span>}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((key) => (
          <FilterChip
            key={key}
            active={timeFilter === key}
            onClick={() => setTimeFilter(key)}
            label={TIME_FILTER_LABELS[key]}
          />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Тип (команда)
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-200"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Усі типи" : t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Сортування
          <select
            value={sort}
            onChange={(e) =>
              handleSortDropdown(e.target.value as SortKey)
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-200"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center text-slate-400">
          Немає задач для обраних фільтрів.
        </div>
      ) : (
        <IssueTable
          issues={filtered}
          sortKey={sort}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {stats.total > 0 && (
        <footer className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-slate-400">
            Задач по типу (команда)
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIssueType(type)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-indigo-500"
                >
                  {type}: {count}
                </button>
              ))}
          </div>
        </footer>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "red" | "amber";
}) {
  const color =
    accent === "red"
      ? "text-red-400"
      : accent === "amber"
        ? "text-amber-400"
        : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${
        active
          ? "bg-indigo-600 text-white"
          : "border border-slate-700 text-slate-400 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
