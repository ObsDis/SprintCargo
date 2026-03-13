import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

interface DashboardLayoutProps {
  role: "shipper" | "driver";
  children: React.ReactNode;
}

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar (desktop: fixed left, mobile: sheet) */}
      <DashboardSidebar role={role} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
