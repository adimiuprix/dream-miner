import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./tonconnect-styles.css";
import { TelegramProvider } from "@/components/TelegramProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { MiningProvider } from "@/components/MiningProvider";
import { TonConnectProvider } from "@/components/TonConnectProvider";
import AppWrapper from "@/components/AppWrapper";
import { CronTrigger } from "@/components/CronTrigger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dream Miner — Mine TON on Telegram",
  description:
    "Dream Miner is a TON-based crypto mining app. Buy power, mine HASHES, and swap to TON.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
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
      </body>
    </html>
  );
}
