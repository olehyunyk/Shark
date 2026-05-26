"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const INTERVAL_MS = 5 * 60 * 1000;

export function TrackedAutoSync() {
  const router = useRouter();
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const running = useRef(false);

  const sync = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setSyncing(true);
    try {
      await fetch("/api/tracked/sync", { method: "POST" });
      setLastRun(new Date());
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
      running.current = false;
    }
  }, [router]);

  useEffect(() => {
    sync();
    const id = setInterval(sync, INTERVAL_MS);
    return () => clearInterval(id);
  }, [sync]);

  return (
    <p className="text-xs text-[var(--text-muted)]">
      Авто-оновлення кожні 5 хв
      {syncing ? " · синхронізація…" : ""}
      {lastRun ? ` · ${lastRun.toLocaleTimeString("uk-UA")}` : ""}
    </p>
  );
}
