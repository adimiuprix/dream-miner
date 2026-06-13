"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import WebApp from "@twa-dev/sdk";

export interface ITelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ITelegramContext {
  webApp: typeof WebApp | null;
  user: ITelegramUser | null;
  startParam: string | null;
  initData: string | null;
  isReady: boolean;
}

export const TelegramContext = createContext<ITelegramContext>({
  webApp: null,
  user: null,
  startParam: null,
  initData: null,
  isReady: false,
});

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [webApp, setWebApp] = useState<typeof WebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const app = WebApp;
        app.ready();
        app.expand();
        setWebApp(app);
      } catch (error) {
        console.warn("Telegram Web App not available (browser mode):", error);
      } finally {
        setIsReady(true);
      }
    }
  }, []);

  if (!isReady) {
    // BUG-020: Tampilkan loading skeleton daripada layar kosong saat WebApp belum ready
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          background: "var(--background, #0a0a0a)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "var(--dm-green, #00d4aa)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user: webApp ? (webApp.initDataUnsafe.user as ITelegramUser) : null,
        startParam: webApp?.initDataUnsafe?.start_param ?? null,
        initData: webApp?.initData ?? null,
        isReady,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
