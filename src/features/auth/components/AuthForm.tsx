"use client";

import Image from "next/image";
import Link from "next/link";
import { GoogleOutlined } from "@ant-design/icons";
import { useState, type FormEvent } from "react";
import { LogoLoading } from "@/components/common/LogoLoading";
import { createClient } from "@/lib/supabase/browser";
import {
  authConfigured,
  callbackUrl,
  continueAsGuest,
  enterApp,
  ensureGoogleEnabled,
} from "@/features/auth/client";
import { authErrorMessage } from "@/features/auth/utils";

type Mode = "login" | "register" | "forgot" | "reset";
const titles: Record<Mode, string> = {
  login: "Chào mừng đến Pinkstorm FC",
  register: "Tạo tài khoản",
  forgot: "Quên mật khẩu",
  reset: "Đặt mật khẩu mới",
};
const descriptions: Record<Mode, string> = {
  login: "Đăng nhập bằng email, Google hoặc tiếp tục sử dụng với tư cách khách.",
  register: "Đăng ký bằng email để có tài khoản Pinkstorm FC.",
  forgot: "Nhập email của bạn để nhận liên kết đặt lại mật khẩu.",
  reset: "Chọn mật khẩu mới cho tài khoản của bạn.",
};

export function AuthForm({
  mode = "login",
  next = "/dashboard",
  initialError = "",
}: {
  mode?: Mode;
  next?: string;
  initialError?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const configured = authConfigured();
  const hasPassword = mode !== "forgot";
  const withConfirm = mode === "register" || mode === "reset";
  const suffix = "?next=" + encodeURIComponent(next);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !configured) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    setError("");
    setNotice("");
    if (withConfirm && password !== fields.get("confirmPassword")) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        enterApp(next);
        return;
      }
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(fields.get("fullName") ?? "").trim() },
            emailRedirectTo: callbackUrl(next),
          },
        });
        if (error) throw error;
        if (data.session) {
          enterApp(next);
          return;
        }
        setNotice(
          "Kiểm tra hộp thư và thư rác để xác nhận email. Nếu đã có tài khoản, hãy đăng nhập hoặc đặt lại mật khẩu.",
        );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl(next, true),
        });
        if (error) throw error;
        setNotice(
          "Nếu email có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư rác.",
        );
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        enterApp(next);
        return;
      }
    } catch (error) {
      setError(authErrorMessage(error));
    }
    setBusy(false);
  }

  async function googleLogin() {
    if (busy || !configured) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await ensureGoogleEnabled();
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(next), skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Missing OAuth URL");
      window.location.assign(data.url);
    } catch (error) {
      setError(authErrorMessage(error));
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="surface auth-card" aria-labelledby="auth-title">
        <div className="auth-heading">
          <Image
            src="/logo-transparent.png"
            alt="Pinkstorm FC"
            width={88}
            height={88}
            className="brand-logo"
            priority
          />
          <h1 id="auth-title">{titles[mode]}</h1>
          <p className="muted">{descriptions[mode]}</p>
        </div>
        {!configured ? (
          <p className="auth-feedback" role="status">
            Đăng nhập chưa được cấu hình. Bạn vẫn có thể tiếp tục với tư cách khách.
          </p>
        ) : null}
        {error ? (
          <p className="auth-feedback auth-feedback-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="auth-feedback auth-feedback-success" role="status">
            {notice}
          </p>
        ) : null}
        {mode === "login" || mode === "register" ? (
          <>
            <button
              className="secondary-action auth-button"
              type="button"
              disabled={busy || !configured}
              onClick={googleLogin}
            >
              <GoogleOutlined aria-hidden="true" /> Tiếp tục với Google
            </button>
            <div className="auth-divider">
              <span>hoặc dùng email</span>
            </div>
          </>
        ) : null}
        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={busy || !configured}>
            {mode === "register" ? (
              <div className="auth-field">
                <label htmlFor="auth-name">Họ tên</label>
                <input
                  className="field"
                  id="auth-name"
                  name="fullName"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </div>
            ) : null}
            {mode !== "reset" ? (
              <div className="auth-field">
                <label htmlFor="auth-email">Email</label>
                <input
                  className="field"
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  maxLength={254}
                  placeholder="ban@example.com"
                />
              </div>
            ) : null}
            {hasPassword ? (
              <div className="auth-field">
                <label htmlFor="auth-password">
                  {mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}
                </label>
                <input
                  className="field"
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={mode === "login" ? undefined : 8}
                  maxLength={128}
                  aria-describedby={withConfirm ? "password-hint" : undefined}
                />
                {withConfirm ? (
                  <small id="password-hint" className="muted">
                    Ít nhất 8 ký tự.
                  </small>
                ) : null}
              </div>
            ) : null}
            {withConfirm ? (
              <div className="auth-field">
                <label htmlFor="auth-confirm">Nhập lại mật khẩu</label>
                <input
                  className="field"
                  id="auth-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>
            ) : null}
            <button className="primary-action auth-button" type="submit">
              {mode === "login"
                ? "Đăng nhập"
                : mode === "register"
                  ? "Đăng ký"
                  : mode === "forgot"
                    ? "Gửi liên kết đặt lại mật khẩu"
                    : "Lưu mật khẩu mới"}
            </button>
          </fieldset>
        </form>
        {busy ? (
          <LogoLoading size="sm" label="Đang xử lý..." />
        ) : (
          <div className="auth-links">
            {mode === "login" ? (
              <>
                <Link href={"/forgot-password" + suffix}>Quên mật khẩu?</Link>
                <Link href={"/register" + suffix}>Tạo tài khoản</Link>
              </>
            ) : (
              <Link href={"/login" + suffix}>Quay lại đăng nhập</Link>
            )}
          </div>
        )}
        <div className="auth-guest">
          <button
            className="secondary-action auth-button"
            type="button"
            disabled={busy}
            onClick={() => continueAsGuest(next)}
          >
            Tiếp tục không đăng nhập
          </button>
          <p className="muted">
            Bạn có thể xem thông tin đội. Chỉ tài khoản admin mới được tạo, sửa và xác nhận thanh
            toán.
          </p>
        </div>
        <Link className="auth-notifications muted" href="/notifications">
          Bật thông báo trên điện thoại
        </Link>
      </section>
    </main>
  );
}
