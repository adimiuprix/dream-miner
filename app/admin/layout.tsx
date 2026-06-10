import type { Metadata } from "next";
import AdminSidebar from "./_components/AdminSidebar";

export const metadata: Metadata = {
  title: "Dream Miner — Admin",
  description: "Admin panel for Dream Miner",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#e5e5e5" }}>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
