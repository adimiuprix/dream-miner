"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin",              icon: "fa-solid fa-gauge",         label: "Dashboard",    section: null },
  { href: "/admin/users",        icon: "fa-solid fa-users",         label: "Users",        section: "Data" },
  { href: "/admin/plans",        icon: "fa-solid fa-box",           label: "Plans",        section: null },
  { href: "/admin/transactions", icon: "fa-solid fa-receipt",       label: "Transactions", section: null },
  { href: "/admin/contracts",    icon: "fa-solid fa-file-contract", label: "Contracts",    section: null },
  { href: "/admin/swaps",        icon: "fa-solid fa-arrows-rotate", label: "Swaps",        section: null },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  let lastSection: string | null = "NONE";

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-icon">⛏</div>
        <div>
          <div className="admin-sidebar-title">Dream Miner</div>
          <div className="admin-sidebar-subtitle">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="admin-nav">
        {navItems.map((item) => {
          const isActive   = pathname === item.href;
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <div key={item.href}>
              {showSection && (
                <div className="admin-nav-section">{item.section}</div>
              )}
              <Link
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
              >
                <i className={item.icon} />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">v1.0.0</div>
    </aside>
  );
}
