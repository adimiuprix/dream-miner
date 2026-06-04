"use client";

import { useTelegram } from "@/components/TelegramProvider";
import WelcomeScreen from "@/components/welcome/WelcomeScreen";
import BottomNav from "@/components/bottom-nav";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { isNewUser, completeOnboarding } = useTelegram();

  if (isNewUser) {
    return <WelcomeScreen onStart={completeOnboarding} />;
  }

  return (
    <>
      {/* Main scrollable area above bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Sticky bottom navigation */}
      <BottomNav />
    </>
  );
}
