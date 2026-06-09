"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useTelegram } from "@/components/TelegramProvider";

export interface IAuthUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string;
  lastName: string | null;
  tonBalance: number;
  walletAddress: string | null;
  referralCode: string;
  lastPingAt: string;
  createdAt: string;
}

type AuthStatus = "loading" | "new_user" | "authenticated";

export interface IAuthContext {
  status: AuthStatus;
  user: IAuthUser | null;
  completeOnboarding: () => void;
}

const AuthContext = createContext<IAuthContext>({
  status: "loading",
  user: null,
  completeOnboarding: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: tgUser, startParam } = useTelegram();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<IAuthUser | null>(null);

  useEffect(() => {
    // Wait until TelegramProvider has initialized
    // tgUser may be null if opened outside Telegram (dev mode)
    const authenticate = async () => {
      // Use Telegram user data if available, otherwise use dev fallback
      const telegramId = tgUser?.id || 0;
      const firstName = tgUser?.first_name || null;
      const username = tgUser?.username || null;
      const lastName = tgUser?.last_name || null;
      const languageCode = tgUser?.language_code || "en";

      // If telegramId is 0 (not in Telegram), check localStorage for dev mode
      if (telegramId === 0) {
        const devUser = localStorage.getItem("dream_miner_dev_user");
        if (devUser) {
          setUser(JSON.parse(devUser));
          setStatus("authenticated");
        } else {
          setStatus("new_user");
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegramId,
            firstName,
            username,
            lastName,
            languageCode,
            referralCode: startParam ?? null,
          }),
        });

        if (!res.ok) {
          console.error("Auth API error:", res.status);
          setStatus("new_user");
          return;
        }

        const data = await res.json();
        setUser(data.user);

        if (data.isNewUser) {
          setStatus("new_user");
        } else {
          setStatus("authenticated");
        }
      } catch (error) {
        console.error("Auth fetch error:", error);
        // Fallback: treat as new user
        setStatus("new_user");
      }
    };

    authenticate();
  }, [tgUser]);

  const completeOnboarding = () => {
    // In dev mode (no Telegram), save to localStorage
    if (!tgUser?.id && user) {
      localStorage.setItem("dream_miner_dev_user", JSON.stringify(user));
    }
    // If we have a user from API (new user was already saved to DB), just switch status
    setStatus("authenticated");
  };

  return (
    <AuthContext.Provider value={{ status, user, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
