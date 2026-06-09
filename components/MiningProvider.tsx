"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";

export interface MiningStats {
  totalPower: number;
  miningRate: number;     // hashes per second
  currentHashes: number;  // total accumulated tersimpan di DB
  pendingHashes: number;  // hashes sejak lastSyncAt (belum di-flush)
  lastSyncAt: number;     // Unix timestamp (ms), baseline untuk animasi client
}

interface MiningContextValue {
  stats: MiningStats | null;
  isLoading: boolean;
  /** Paksa sync ke DB lalu perbarui stats */
  refresh: () => Promise<void>;
}

const MiningContext = createContext<MiningContextValue>({
  stats: null,
  isLoading: true,
  refresh: async () => {},
});

export function MiningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Sync ke DB (POST) — flush accumulatedHashes lalu baca stats terbaru */
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/mining/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("[MiningProvider] refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Sync pertama saat mount, lalu setiap 10 detik
  useEffect(() => {
    if (!user?.id) return;
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [user?.id, refresh]);

  return (
    <MiningContext.Provider value={{ stats, isLoading, refresh }}>
      {children}
    </MiningContext.Provider>
  );
}

export const useMining = () => useContext(MiningContext);
