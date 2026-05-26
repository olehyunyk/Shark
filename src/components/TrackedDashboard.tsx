"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { TrackedIssueRow } from "@/db/schema";
import {
  TRACKED_CATEGORIES,
  type TrackedCategory,
} from "@/config/tracked-categories";
import { TrackedAutoSync } from "@/components/TrackedAutoSync";
import { TrackedIssueTable } from "@/components/TrackedIssueTable";
import { TrackedSyncButton } from "@/components/TrackedSyncButton";
import {
  isDueWithinDays,
  isOverdue,
} from "@/lib/issue-metrics";

type Props = {
  issues: TrackedIssueRow[];
  lastSyncLabel: string | null;
};

export function TrackedDashboard({ issues, lastSyncLabel }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<TrackedCategory>("business_feature");
  const [keyInput, setKeyInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const stats = useMemo(() => {
    let overdue = 0;
    let noDue = 0;
    let dueIn7 = 0;
    for (const issue of issues) {
      if (!issue.dueDate) noDue++;
      else if (isOverdue(issue.dueDate)) overdue++;
      else if (isDueWithinDays(issue.dueDate, 7)) dueIn7++;
    }
    return { overdue, noDue, dueIn7 };
  }, [issues]);

  const filtered = useMemo(() => {
    if (filterCategory === "all") return issues;
    return issues.filter((i) => i.category === filterCategory);
  }, [issues, filterCategory]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyInput, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");
      setKeyInput("");
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
            Business Feature / Product request
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Окремий список задач з різних бордів Jira — додавайте ключі вручну
            ({issues.length} у списку)
          </p>
          {lastSyncLabel && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {lastSyncLabel}
            </p>
          )}
          <TrackedAutoSync />
        </div>
        <TrackedSyncButton />
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Усього" value={issues.length} />
        <StatCard label="Прострочені" value={stats.overdue} accent="red" />
        <StatCard label="≤ 7 днів" value={stats.dueIn7} accent="amber" />
        <StatCard label="Без дедлайну" value={stats.noDue} />
      </div>

      <form
        onSubmit={handleAdd}
        className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
      >
        <p className="mb-3 text-sm font-medium text-[var(--text)]">
          Додати задачу за ключем
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
            Тип
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as TrackedCategory)
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[var(--text)]"
            >
              {TRACKED_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-sm text-[var(--text-secondary)]">
            Ключ Jira
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
              placeholder="MK-123"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 font-mono text-[var(--text)] focus:border-[var(--border-strong)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={adding || !keyInput.trim()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {adding ? "Додавання…" : "Додати"}
          </button>
        </div>
        {addError && (
          <p className="mt-2 text-sm text-[var(--danger)]">{addError}</p>
        )}
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={filterCategory === "all"}
          onClick={() => setFilterCategory("all")}
          label="Усі"
        />
        {TRACKED_CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            active={filterCategory === c.id}
            onClick={() => setFilterCategory(c.id)}
            label={c.label}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center text-[var(--text-secondary)]">
          {issues.length === 0
            ? "Додайте ключ задачі (наприклад MK-100 або інший проєкт)."
            : "Немає задач для обраного фільтра."}
        </div>
      ) : (
        <TrackedIssueTable issues={filtered} />
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
