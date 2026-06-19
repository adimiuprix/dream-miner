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
      console.log("[Adsgram] showAd called, showAdsgram ready:", !!showAdsgram);
      
      if (!showAdsgram) {
        console.error("[Adsgram] SDK not ready");
        return false;
      }
      
      console.log("[Adsgram] Calling showAdsgram.show()...");
      await showAdsgram.show();
      console.log("[Adsgram] Ad completed successfully");
      return true;
    } catch (error) {
      console.error("[Adsgram] Ad error:", error);
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
