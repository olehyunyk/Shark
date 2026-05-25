"use client";

import { useState } from "react";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    const secret = prompt("CRON_SECRET для синхронізації:");
    if (!secret) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");
      setMessage(`Синхронізовано ${data.count} задач`);
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
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Синхронізація…" : "Оновити з Jira"}
      </button>
      {message && <span className="text-sm text-slate-400">{message}</span>}
    </div>
  );
}
