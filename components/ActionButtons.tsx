"use client";

import { useState } from "react";

interface ActionButtonsProps {
  referralCode: string;
}

export default function ActionButtons({ referralCode }: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);

  const BOT_USERNAME = "dreamminerz_bot";

  const referralLink = referralCode
    ? `https://t.me/${BOT_USERNAME}/app?startapp=${referralCode}`
    : "";

  const handleShare = () => {
    if (!referralLink) return;
    const text = encodeURIComponent(
      `Join Dream Miner and start earning! Use my referral link:\n${referralLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for Telegram WebApp environment
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
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
        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
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
