"use client";

import { createClient } from "@/lib/supabase/browser";
import { guestCookieName, safeNextPath, publicViewPath } from "@/features/auth/utils";

export function authConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function callbackUrl(next: string, recovery = false) {
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", safeNextPath(next));
  if (recovery) url.searchParams.set("type", "recovery");
  return url.toString();
}

export function continueAsGuest(next: string) {
  document.cookie = `${guestCookieName}=1; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.location.assign(publicViewPath(next));
}

export function enterApp(next: string) {
  document.cookie = `${guestCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  // A full navigation also clears any account-specific Next.js router cache.
  window.location.assign(safeNextPath(next));
}

export async function signOut(next = "/dashboard") {
  const { error } = await createClient().auth.signOut({ scope: "local" });
  if (error) throw error;
  document.cookie = `${guestCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.location.assign(publicViewPath(next));
}
export async function ensureGoogleEnabled() {
  const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/settings", {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Auth settings unavailable");
  const settings = await response.json();
  if (!settings.external?.google) throw { code: "provider_disabled" };
}
