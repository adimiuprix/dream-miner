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
  isNewUser: boolean;
  completeOnboarding: () => void;
}

export const TelegramContext = createContext<ITelegramContext>({
  webApp: null,
  user: null,
  isNewUser: false,
  completeOnboarding: () => {},
});

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [webApp, setWebApp] = useState<typeof WebApp | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Ensuring it only runs on the client
    if (typeof window !== "undefined") {
      const app = WebApp;
      // Initialize the Telegram Web App
      app.ready();
      // Expanding the app to full height by default is usually preferred
      app.expand();
      setWebApp(app);

      // Check local storage for onboarding state
      const hasStarted = localStorage.getItem("dream_miner_started");
      if (!hasStarted) {
        setIsNewUser(true);
      }
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("dream_miner_started", "true");
    setIsNewUser(false);
  };

  if (isLoading) {
    // Prevent hydration mismatch or flash of content by rendering nothing until client check is done
    return null;
  }

  return (
    <TelegramContext.Provider
      value={{
        webApp,
        user: webApp ? (webApp.initDataUnsafe.user as ITelegramUser) : null,
        isNewUser,
        completeOnboarding,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
