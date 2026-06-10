import type { Metadata } from "next";
import AdminSidebar from "./_components/AdminSidebar";
import "./admin.css";

export const metadata: Metadata = {
  title: "Dream Miner — Admin",
  description: "Admin panel for Dream Miner",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
