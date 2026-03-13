import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Determine redirect based on role
      const role = data.user.user_metadata?.role as string | undefined;

      if (role === "shipper") {
        return NextResponse.redirect(
          new URL("/dashboard/shipper", requestUrl.origin)
        );
      }
      if (role === "driver") {
        return NextResponse.redirect(
          new URL("/dashboard/driver", requestUrl.origin)
        );
      }

      // Fallback: check profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "shipper") {
        return NextResponse.redirect(
          new URL("/dashboard/shipper", requestUrl.origin)
        );
      }
      if (profile?.role === "driver") {
        return NextResponse.redirect(
          new URL("/dashboard/driver", requestUrl.origin)
        );
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=auth_callback_error", requestUrl.origin)
  );
}
