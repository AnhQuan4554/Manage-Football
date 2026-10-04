"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { authConfigured } from "@/features/auth/client";
import { createClient } from "@/lib/supabase/browser";

const ManageContext = createContext(false);

// UI capability only. API and RLS independently authorize every mutation.
export function PermissionsProvider({
  canManage,
  children,
}: {
  canManage: boolean;
  children: ReactNode;
}) {
  const [sessionEnded, setSessionEnded] = useState(false);
  useEffect(() => {
    if (!authConfigured()) return;
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setSessionEnded(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!canManage) setSessionEnded(false);
  }, [canManage]);
  return (
    <ManageContext.Provider value={canManage && !sessionEnded}>{children}</ManageContext.Provider>
  );
}

export function useCanManage() {
  return useContext(ManageContext);
}

export function AdminOnly({ children }: { children: ReactNode }) {
  return useCanManage() ? <>{children}</> : null;
}
