"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrackedRemoveButton({ issueKey }: { issueKey: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Прибрати ${issueKey} зі списку?`)) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tracked?key=${encodeURIComponent(issueKey)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");
      router.refresh();
    } catch {
      alert("Не вдалося видалити");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="text-sm text-[var(--text-muted)] hover:text-[var(--danger)] disabled:opacity-50"
      title="Прибрати зі списку"
    >
      {loading ? "…" : "✕"}
    </button>
  );
}
