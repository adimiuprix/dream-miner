import type { Metadata } from "next";
import AdminSidebar from "./_components/AdminSidebar";
import AdminMobileBar from "./_components/AdminMobileBar";
import "./admin.css";

export const metadata: Metadata = {
  title: "Dream Miner — Admin",
  description: "Admin panel for Dream Miner",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      {/* Mobile top bar + drawer — rendered outside the flex row so it sits on top */}
      <AdminMobileBar />

      {/* Desktop/tablet: sidebar + main side by side */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
