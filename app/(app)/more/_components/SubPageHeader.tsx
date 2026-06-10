"use client";

import { useRouter } from "next/navigation";

interface SubPageHeaderProps {
  title: string;
  description?: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  iconBorder?: string;
}

export default function SubPageHeader({
  title, description, icon,
  iconColor = "var(--dm-green)",
  iconBg    = "rgba(0,212,170,0.08)",
  iconBorder = "rgba(0,212,170,0.2)",
}: SubPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-xl mb-2 transition-opacity hover:opacity-75 active:scale-95"
          style={{ width: 44, height: 44, background: iconBg, border: `1px solid ${iconBorder}` }}
          aria-label="Go back"
        >
          <i className="fa-solid fa-chevron-left" style={{ color: iconColor, fontSize: "18px" }} />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>{title}</h1>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>{description}</p>
        )}
      </div>
    </div>
  );
}
