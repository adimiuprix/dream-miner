import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/bottom-nav";
import { TelegramProvider } from "@/components/TelegramProvider";

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
          {/* Main scrollable area above bottom nav */}
          <main className="flex-1 overflow-y-auto pb-20">{children}</main>

          {/* Sticky bottom navigation */}
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
