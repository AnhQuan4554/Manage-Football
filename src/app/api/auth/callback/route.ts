import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guestCookieName, safeNextPath } from "@/features/auth/utils";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const next = safeNextPath(params.get("next"));
  const recovery = type === "recovery";

  try {
    if (!params.has("error")) {
      const supabase = await createClient();
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : tokenHash && (type === "email" || type === "signup" || type === "recovery")
          ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          : null;
      if (result && !result.error && result.data.session) {
        const response = NextResponse.redirect(
          new URL(recovery ? "/reset-password" : next, request.url),
        );
        response.cookies.delete(guestCookieName);
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("Referrer-Policy", "no-referrer");
        return response;
      }
    }
  } catch {
    // Never leak tokens or provider errors in the redirect URL.
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "callback");
  loginUrl.searchParams.set("next", next);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
