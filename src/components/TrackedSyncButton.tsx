"use client";

import { useState } from "react";

export function TrackedSyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tracked/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");
      const extra =
        data.missing > 0
          ? ` · не знайдено в Jira: ${data.missing}`
          : "";
      setMessage(`Оновлено ${data.count} задач${extra}`);
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Помилка синхронізації");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Синхронізація…" : "Оновити з Jira"}
      </button>
      {message && (
        <span className="text-sm text-[var(--text-secondary)]">{message}</span>
      )}
    </div>
  );
}
