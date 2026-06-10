"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin",              icon: "fa-solid fa-gauge",        label: "Dashboard"    },
  { href: "/admin/users",        icon: "fa-solid fa-users",        label: "Users"        },
  { href: "/admin/plans",        icon: "fa-solid fa-box",          label: "Plans"        },
  { href: "/admin/transactions", icon: "fa-solid fa-receipt",      label: "Transactions" },
  { href: "/admin/contracts",    icon: "fa-solid fa-file-contract", label: "Contracts"   },
  { href: "/admin/swaps",        icon: "fa-solid fa-arrows-rotate", label: "Swaps"       },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col"
      style={{ background: "#111", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)" }}
        >
          <span style={{ color: "var(--dm-green)", fontSize: "14px" }}>⛏</span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#fff" }}>Dream Miner</p>
          <p className="text-xs" style={{ color: "#555" }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color:      isActive ? "#fff"                        : "#666",
                background: isActive ? "rgba(0,212,170,0.1)"        : "transparent",
                borderLeft: isActive ? "2px solid var(--dm-green)"   : "2px solid transparent",
              }}
            >
              <i className={item.icon} style={{ fontSize: "14px", width: 16 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-xs" style={{ color: "#333" }}>v1.0.0</p>
      </div>
    </aside>
  );
}
