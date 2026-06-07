"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";

export interface MiningStats {
  totalPower: number;
  miningRate: number;   // hashes per second
  currentHashes: number;
  offlineHashes: number;
}

interface MiningContextValue {
  stats: MiningStats | null;
  isLoading: boolean;
  /** Paksa re-fetch stats dari server sekarang */
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

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/mining/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("[MiningProvider] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    if (!user?.id) return;
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [user?.id, fetchStats]);

  return (
    <MiningContext.Provider value={{ stats, isLoading, refresh: fetchStats }}>
      {children}
    </MiningContext.Provider>
  );
}

export const useMining = () => useContext(MiningContext);
