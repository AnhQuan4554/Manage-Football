import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // These new routes have their own device/cron authorization; no prototype login dependency.
  if (
    path === "/notifications" ||
    path.startsWith("/api/notifications/") ||
    path === "/push-worker.js" ||
    path === "/sw.js"
  )
    return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.jpg|manifest.json|robots.txt).*)"],
};
