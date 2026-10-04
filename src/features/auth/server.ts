import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasAuthCookie, isAdmin } from "@/features/auth/utils";
import type { Account } from "@/features/auth/types";
import { fail, ok } from "@/lib/response";

export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return null;
  if (!hasAuthCookie((await cookies()).getAll())) return null;

  try {
    const supabase = await createClient();
    // Validate with Auth; never authorize from a cookie or user_metadata.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role, status")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name || user.email || "Thành viên",
      role: !profileError && profile?.role === "admin" ? "admin" : "member",
      status: !profileError && profile ? profile.status : "pending",
    };
  } catch {
    // Auth outages must not prevent use of the existing guest features.
    return null;
  }
});

// Enforce all business mutations; read the DB on each request so role
// changes take effect without waiting for an old JWT to expire.
export async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account)
    return { status: 401, result: fail("unauthenticated", "Vui lòng đăng nhập.") } as const;
  if (!isAdmin(account))
    return { status: 403, result: fail("forbidden", "Bạn không có quyền admin.") } as const;
  return { status: 200, result: ok(account) } as const;
}
