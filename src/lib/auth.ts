import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function requireRole(role: "shipper" | "driver") {
  const user = await requireAuth();

  const userRole = user.user_metadata?.role as string | undefined;

  if (userRole !== role) {
    // Redirect to the correct dashboard if they have a role, otherwise login
    if (userRole === "shipper" || userRole === "driver") {
      redirect(`/dashboard/${userRole}`);
    }
    redirect("/auth/login");
  }

  return user;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // First check user_metadata
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.user_metadata?.role) {
    return user.user_metadata.role as string;
  }

  // Fallback: check profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role ?? null;
}
