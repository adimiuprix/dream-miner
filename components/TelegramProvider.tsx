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
  isReady: boolean;
}

export const TelegramContext = createContext<ITelegramContext>({
  webApp: null,
  user: null,
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

  if (!isReady) return null;

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user: webApp ? (webApp.initDataUnsafe.user as ITelegramUser) : null,
        isReady,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
