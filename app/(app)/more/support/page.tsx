"use client";

import SubPageHeader from "../_components/SubPageHeader";

const SUPPORT_ITEMS = [
  {
    icon: "fa-brands fa-telegram",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.2)",
    title: "Telegram Support",
    sub: "Chat with our support team",
    href: "https://t.me/DreamMinerSupport",
  },
  {
    icon: "fa-brands fa-telegram",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.2)",
    title: "Community Group",
    sub: "Join our Telegram community",
    href: "https://t.me/DreamMinerCommunity",
  },
  {
    icon: "fa-brands fa-x-twitter",
    color: "#a3a3a3",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.1)",
    title: "X (Twitter)",
    sub: "Follow us for updates",
    href: "https://x.com/DreamMinerTON",
  },
];

const FAQ = [
  {
    q: "How does mining work?",
    a: "When you buy a Power plan, you accumulate HASHES over time based on your total Power. More Power = faster mining.",
  },
  {
    q: "How do I get my TON?",
    a: "Once you have enough HASHES (min. 1,000), go to the home screen and tap Swap HASHES → TON.",
  },
  {
    q: "When does my plan expire?",
    a: "Each plan has a fixed duration (e.g. 30 days). After it expires, mining stops for that contract.",
  },
  {
    q: "Why is my wallet address different?",
    a: "TON addresses can be displayed in multiple formats (bounceable, non-bounceable). They all point to the same wallet.",
  },
];

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-20" style={{ background: "var(--background)" }}>
      <SubPageHeader
        title="Support"
        description="Get help from our team"
        icon="fa-solid fa-headset"
        iconColor="#a3a3a3"
        iconBg="rgba(255,255,255,0.06)"
        iconBorder="rgba(255,255,255,0.1)"
      />

      {/* Contact */}
      <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Contact
      </p>
      <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
        {SUPPORT_ITEMS.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-4 py-4 transition-opacity hover:opacity-80"
            style={{ borderBottom: i < SUPPORT_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
          >
            <div className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 40, height: 40, background: item.bg, border: `1px solid ${item.border}` }}>
              <i className={item.icon} style={{ color: item.color, fontSize: "16px" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#fff" }}>{item.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b6b6b" }}>{item.sub}</p>
            </div>
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: "#444", fontSize: "12px" }} />
          </a>
        ))}
      </div>

      {/* FAQ */}
      <p className="text-xs font-semibold mb-2" style={{ color: "#404040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        FAQ
      </p>
      <div className="flex flex-col gap-2">
        {FAQ.map((item, i) => (
          <div key={i} className="rounded-2xl px-4 py-4"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#fff" }}>{item.q}</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6b6b6b" }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
