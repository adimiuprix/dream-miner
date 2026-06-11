"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin",              icon: "fa-solid fa-gauge",         label: "Dashboard"    },
  { href: "/admin/users",        icon: "fa-solid fa-users",         label: "Users"        },
  { href: "/admin/plans",        icon: "fa-solid fa-box",           label: "Plans"        },
  { href: "/admin/transactions", icon: "fa-solid fa-receipt",       label: "Transactions" },
  { href: "/admin/contracts",    icon: "fa-solid fa-file-contract", label: "Contracts"    },
  { href: "/admin/swaps",        icon: "fa-solid fa-arrows-rotate", label: "Swaps"        },
  { href: "/admin/settings",     icon: "fa-solid fa-gear",          label: "Settings"     },
];

export default function AdminMobileBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar — only visible on mobile via CSS */}
      <div className="admin-mobile-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="admin-sidebar-logo-icon" style={{ width: 28, height: 28, fontSize: 13 }}>
            ⛏
          </div>
          <span className="admin-sidebar-title">Admin Panel</span>
        </div>
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="admin-mobile-overlay" onClick={() => setOpen(false)}>
          <aside
            className="admin-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-sidebar-logo">
              <div className="admin-sidebar-logo-icon">⛏</div>
              <div>
                <div className="admin-sidebar-title">Dream Miner</div>
                <div className="admin-sidebar-subtitle">Admin Panel</div>
              </div>
            </div>
            <nav className="admin-nav">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${pathname === item.href ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <i className={item.icon} />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="admin-sidebar-footer">v1.0.0</div>
          </aside>
        </div>
      )}
    </>
  );
}
