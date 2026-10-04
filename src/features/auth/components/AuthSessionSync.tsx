"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { authConfigured } from "@/features/auth/client";

export function AuthSessionSync() {
  const router = useRouter();
  useEffect(() => {
    if (!authConfigured()) return;
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);
  return null;
}
