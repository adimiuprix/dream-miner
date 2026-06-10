import Script from "next/script";
import { TelegramProvider } from "@/components/TelegramProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { MiningProvider } from "@/components/MiningProvider";
import { TonConnectProvider } from "@/components/TonConnectProvider";
import AppWrapper from "@/components/AppWrapper";
import { CronTrigger } from "@/components/CronTrigger";

/**
 * Layout khusus Telegram Mini App.
 * Semua provider (Telegram, TonConnect, Auth, Mining) hanya aktif di sini.
 * Halaman /admin tidak mewarisi layout ini.
 */
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
              <CronTrigger />
              <AppWrapper>{children}</AppWrapper>
            </MiningProvider>
          </AuthProvider>
        </TonConnectProvider>
      </TelegramProvider>
    </>
  );
}
