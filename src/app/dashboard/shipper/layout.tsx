import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function ShipperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check role from user metadata or a profiles table
  const role = user.user_metadata?.role as string | undefined;

  if (role !== "shipper") {
    // If authenticated but wrong role, redirect to correct dashboard
    if (role === "driver") {
      redirect("/dashboard/driver");
    }
    // Fallback: send back to login
    redirect("/auth/login");
  }

  return <DashboardLayout role="shipper">{children}</DashboardLayout>;
}
