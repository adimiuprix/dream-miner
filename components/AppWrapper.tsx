"use client";

import { useAuth } from "@/components/AuthProvider";
import { useWalletSync } from "@/hooks/use-wallet-sync";
import WelcomeScreen from "@/components/welcome/WelcomeScreen";
import BottomNav from "@/components/bottom-nav";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { status, completeOnboarding } = useAuth();

  // Sync TON wallet connect/disconnect → DB secara otomatis
  useWalletSync();

  // Loading state — show a minimal loading screen
  if (status === "loading") {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--dm-green)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "#555" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // New user — show welcome screen
  if (status === "new_user") {
    return <WelcomeScreen onStart={completeOnboarding} />;
  }

  // Authenticated — show app
  return (
    <>
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <BottomNav />
    </>
  );
}
