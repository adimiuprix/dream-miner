"use client";

import { createContext, useContext, useCallback } from "react";
import { useAdsgram } from "@adsgram/react";

interface AdsgramContextType {
  showAd: () => Promise<boolean>;
  isReady: boolean;
}

const AdsgramContext = createContext<AdsgramContextType>({
  showAd: async () => false,
  isReady: false,
});

export function AdsgramProvider({ children }: { children: React.ReactNode }) {
  const blockId = (process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID || "503") as `${number}`;
  
  const showAdsgram = useAdsgram({ blockId });

  const showAd = useCallback(async (): Promise<boolean> => {
    try {
      if (showAdsgram) {
        await showAdsgram.show();
        return true;
      }
      return false;
    } catch (error) {
      console.log("[Adsgram] Ad skipped or failed:", error);
      return false;
    }
  }, [showAdsgram]);

  return (
    <AdsgramContext.Provider value={{ showAd, isReady: !!showAdsgram }}>
      {children}
    </AdsgramContext.Provider>
  );
}

export const useAds = () => useContext(AdsgramContext);
