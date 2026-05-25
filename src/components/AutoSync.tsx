"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVAL_MS = 5 * 60 * 1000;

export function AutoSync({ boardId = "mk" }: { boardId?: string }) {
  const router = useRouter();
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const running = useRef(false);

  const sync = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setSyncing(true);
    try {
      await fetch(`/api/sync?board=${boardId}`, { method: "POST" });
      setLastRun(new Date());
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
      running.current = false;
    }
  }, [boardId, router]);

  useEffect(() => {
    const id = setInterval(sync, INTERVAL_MS);
    return () => clearInterval(id);
  }, [sync]);

  return (
    <p className="text-xs text-slate-500">
      Авто-оновлення кожні 5 хв
      {syncing ? " · синхронізація…" : ""}
      {lastRun ? ` · ${lastRun.toLocaleTimeString("uk-UA")}` : ""}
    </p>
  );
}
