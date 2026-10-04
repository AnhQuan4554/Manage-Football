import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAuthCookie } from "@/features/auth/utils";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && hasAuthCookie(request.cookies.getAll())) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    try {
      await supabase.auth.getUser();
    } catch {
      // Public pages remain available during an Auth outage.
    }
    // Forward refreshed request cookies to Server Components.
    const refreshed = NextResponse.next({ request });
    response.cookies.getAll().forEach((cookie) => refreshed.cookies.set(cookie));
    response = refreshed;
  }

  // Viewing is public. Admin pages and mutation APIs enforce their own permissions.

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
