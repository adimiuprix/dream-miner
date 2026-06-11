"use client";

import { useState, useEffect } from "react";

interface ActionButtonsProps {
  referralCode: string;
}

export default function ActionButtons({ referralCode }: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config?.botUsername) {
          setBotUsername(data.config.botUsername);
        }
      })
      .catch((err) => console.error("[ActionButtons] Failed to fetch config:", err));
  }, []);

  const referralLink =
    botUsername && referralCode
      ? `https://t.me/${botUsername}/app?startapp=${referralCode}`
      : "";

  const handleShare = () => {
    if (!referralLink) return;
    const text = encodeURIComponent(
      `Join Dream Miner and start earning! Use my referral link:\n${referralLink}`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`,
      "_blank"
    );
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      // Fallback for Telegram WebApp environment
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <button
        onClick={handleShare}
        disabled={!referralLink}
        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
        style={{
          background: "linear-gradient(135deg, #00d4aa 0%, #00b890 100%)",
          color: "#050505",
        }}
      >
        <i className="fa-solid fa-paper-plane" />
        Get Referrals
      </button>
      <button
        onClick={handleCopy}
        disabled={!referralLink}
        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.08)",
          color: copied ? "var(--dm-green)" : "#a3a3a3",
        }}
      >
        <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"} />
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
