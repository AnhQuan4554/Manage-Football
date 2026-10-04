"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Account } from "@/features/auth/types";
import { authErrorMessage, isAdmin } from "@/features/auth/utils";
import { signOut } from "@/features/auth/client";
import { LogoLoading } from "@/components/common/LogoLoading";

export function AccountMenu({ account }: { account: Account | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const returnPath = pathname + (query ? "?" + query : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await signOut(window.location.pathname + window.location.search);
    } catch (error) {
      setError(authErrorMessage(error));
      setBusy(false);
    }
  }

  return (
    <div className="account-menu">
      <div className="account-identity">
        <strong>{account?.fullName || "Khách"}</strong>
        <span className={isAdmin(account) ? "account-role account-role-admin" : "account-role"}>
          {isAdmin(account) ? "Admin" : "Chỉ xem"}
        </span>
      </div>
      {account ? (
        <button
          className="secondary-action auth-button"
          type="button"
          disabled={busy}
          onClick={logout}
        >
          Đăng xuất
        </button>
      ) : (
        <Link
          className="secondary-action auth-button"
          href={"/login?next=" + encodeURIComponent(returnPath)}
        >
          Đăng nhập
        </Link>
      )}
      {busy ? <LogoLoading size="sm" label="Đang đăng xuất..." /> : null}
      {error ? (
        <p className="auth-feedback auth-feedback-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
