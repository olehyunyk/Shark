"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [pageSize, setPageSize] = useState<10 | 20>(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [timeFilter, issueType, sort, sortDirection]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

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
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
            Звіт по дедлайнах
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            <a
              href={boardUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--link)] hover:underline"
            >
              {boardName}
            </a>
            {" · "}
            {filtered.length === 0
              ? `0 з ${stats.total}`
              : `${rangeStart}–${rangeEnd} з ${filtered.length} (усього ${stats.total})`}
          </p>
          {lastSyncLabel && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {lastSyncLabel}
            </p>
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

      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-[var(--text)]">
          JQL (зберігається в БД, не в .env)
        </label>
        <textarea
          value={jql}
          onChange={(e) => setJql(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-[var(--border-strong)] focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveJql}
            disabled={jqlSaving}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {jqlSaving ? "Збереження…" : "Зберегти JQL"}
          </button>
          <button
            type="button"
            onClick={() => setJql(defaultJql)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            Скинути до default
          </button>
          {jqlMsg && (
            <span className="text-sm text-[var(--text-secondary)]">{jqlMsg}</span>
          )}
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
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          Тип (команда)
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[var(--text)]"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Усі типи" : t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          Сортування
          <select
            value={sort}
            onChange={(e) =>
              handleSortDropdown(e.target.value as SortKey)
            }
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[var(--text)]"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          На сторінці
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as 10 | 20);
              setPage(1);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[var(--text)]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center text-[var(--text-secondary)]">
          Немає задач для обраних фільтрів.
        </div>
      ) : (
        <>
          <IssueTable
            issues={pageIssues}
            sortKey={sort}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          {totalPages > 1 && (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {stats.total > 0 && (
        <footer className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
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
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
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
      ? "text-[var(--danger)]"
      : accent === "amber"
        ? "text-[var(--warning)]"
        : "text-[var(--text)]";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function TablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[var(--text-muted)]">
        Сторінка {page} з {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Попередня
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Наступна →
        </button>
      </div>
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
          ? "bg-[var(--chip-active)] text-white"
          : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </button>
  );
}
