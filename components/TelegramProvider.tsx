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
}

export const TelegramContext = createContext<ITelegramContext>({
  webApp: null,
  user: null,
});

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [webApp, setWebApp] = useState<typeof WebApp | null>(null);

  useEffect(() => {
    // Ensuring it only runs on the client
    if (typeof window !== "undefined") {
      const app = WebApp;
      // Initialize the Telegram Web App
      app.ready();
      // Expanding the app to full height by default is usually preferred
      app.expand();
      setWebApp(app);
    }
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user: webApp ? (webApp.initDataUnsafe.user as ITelegramUser) : null,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
