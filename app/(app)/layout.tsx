import Script from "next/script";
import { TelegramProvider } from "@/components/TelegramProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { MiningProvider } from "@/components/MiningProvider";
import { TonConnectProvider } from "@/components/TonConnectProvider";
import { AdsgramProvider } from "@/components/AdsgramProvider";
import AppWrapper from "@/components/AppWrapper";
import { CronTrigger } from "@/components/CronTrigger";
import { Toaster } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramProvider>
        <TonConnectProvider>
          <AuthProvider>
            <MiningProvider>
              <AdsgramProvider>
                <CronTrigger />
                <AppWrapper>{children}</AppWrapper>
                <Toaster />
              </AdsgramProvider>
            </MiningProvider>
          </AuthProvider>
        </TonConnectProvider>
      </TelegramProvider>
    </>
  );
}
