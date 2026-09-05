"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function RefreshOnResume() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let lastRefresh = 0;
    const refresh = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      const now = Date.now();
      if (now - lastRefresh < 5000) return;
      lastRefresh = now;
      router.refresh();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("pageshow", onPageShow);
    const interval = pathname === "/dashboard" ? window.setInterval(refresh, 60000) : undefined;

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("pageshow", onPageShow);
      window.clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
