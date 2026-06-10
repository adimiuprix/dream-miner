import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./tonconnect-styles.css";

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
  description: "Dream Miner is a TON-based crypto mining app. Buy power, mine HASHES, and swap to TON.",
};

/**
 * Root layout — bare minimum.
 * Providers (Telegram, TonConnect, Auth, Mining) hanya ada di (app)/layout.tsx
 * sehingga halaman /admin sama sekali tidak tersentuh.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        {children}
      </body>
    </html>
  );
}
