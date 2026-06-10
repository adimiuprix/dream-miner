"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import { ReactNode } from "react";

interface TonConnectProviderProps {
  children: ReactNode;
}

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  const manifestUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tonconnect-manifest.json`
    : "https://yourdomain.com/tonconnect-manifest.json";

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      uiPreferences={{
        theme: THEME.DARK,
        borderRadius: "m",
        colorsSet: {
          [THEME.DARK]: {
            connectButton: {
              background:  "#00d4aa",
              foreground:  "#050505",
            },
            accent:          "#00d4aa",
            telegramButton:  "#00d4aa",
            icon: {
              primary:   "#00d4aa",
              secondary: "#5a8a75",
              tertiary:  "#2a3a30",
              success:   "#10b981",
              error:     "#ef4444",
            },
            background: {
              primary:   "#161616",
              secondary: "#111111",
              segment:   "#1a1a1a",
              tint:      "#0c2b20",
              qr:        "#ffffff",
            },
            text: {
              primary:   "#f1f3f9",
              secondary: "#6b7280",
            },
          },
        },
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
