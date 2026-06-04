"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "HOME",
    icon: "fa-solid fa-bolt",
  },
  {
    href: "/shop",
    label: "SHOP",
    icon: "fa-solid fa-plus",
  },
  {
    href: "/trophy",
    label: "TROPHY",
    icon: "fa-solid fa-trophy",
  },
  {
    href: "/team",
    label: "TEAM",
    icon: "fa-solid fa-users",
  },
  {
    href: "/more",
    label: "MORE",
    icon: "fa-solid fa-bars",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(to top, #0d0d0d 80%, rgba(13,13,13,0.95))",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch justify-around max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-3 relative transition-all duration-200"
              style={{
                color: isActive ? "var(--dm-green)" : "#555",
                textDecoration: "none",
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{
                    width: "40px",
                    height: "2px",
                    background: "var(--dm-green)",
                    boxShadow: "0 0 8px 2px rgba(0,212,170,0.5)",
                  }}
                />
              )}

              {/* Shop icon has special circle styling */}
              {item.label === "SHOP" ? (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "30px",
                    height: "30px",
                    border: isActive
                      ? "1.5px solid var(--dm-green)"
                      : "1.5px solid #444",
                    color: isActive ? "var(--dm-green)" : "#555",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                >
                  <i className={item.icon} style={{ fontSize: "14px" }} />
                </span>
              ) : (
                <i className={item.icon} style={{ fontSize: "18px" }} />
              )}

              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
