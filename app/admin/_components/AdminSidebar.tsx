"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin",              icon: "fa-solid fa-gauge",         label: "Dashboard"    },
  { href: "/admin/users",        icon: "fa-solid fa-users",         label: "Users"        },
  { href: "/admin/plans",        icon: "fa-solid fa-box",           label: "Plans"        },
  { href: "/admin/transactions", icon: "fa-solid fa-receipt",       label: "Transactions" },
  { href: "/admin/contracts",    icon: "fa-solid fa-file-contract", label: "Contracts"    },
  { href: "/admin/swaps",        icon: "fa-solid fa-arrows-rotate", label: "Swaps"        },
  { href: "/admin/settings",     icon: "fa-solid fa-gear",          label: "Settings"     },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
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
          >
            <i className={item.icon} />
            <span className="admin-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          onClick={handleLogout}
          className="admin-nav-item"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "#666" }}
        >
          <i className="fa-solid fa-right-from-bracket" />
          <span className="admin-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
