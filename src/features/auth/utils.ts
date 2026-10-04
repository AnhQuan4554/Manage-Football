export const guestCookieName = "pinkstorm_guest";

const appPaths = [
  "/dashboard",
  "/matches",
  "/members",
  "/funds",
  "/lineup",
  "/media",
  "/team",
  "/settings",
  "/statistics",
  "/opponents",
];

export function isAppPath(path: string) {
  return appPaths.some((base) => path === base || path.startsWith(`${base}/`));
}

// Only return to application pages. Reject protocol-relative URLs, backslashes,
// control characters and auth/API paths to prevent open redirects and loops.
export function safeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value)) {
    return "/dashboard";
  }
  try {
    const url = new URL(value, "https://pinkstorm.invalid");
    if (url.origin !== "https://pinkstorm.invalid" || !isAppPath(url.pathname)) {
      return "/dashboard";
    }
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

// Leave admin-only form routes when continuing as a viewer or signing out.
export function publicViewPath(value: unknown) {
  const url = new URL(safeNextPath(value), "https://pinkstorm.invalid");
  url.pathname = url.pathname.replace(/\/(new|edit)\/?$/, "");
  return url.pathname + url.search;
}

export function hasAuthCookie(cookies: { name: string }[]) {
  return cookies.some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
}

export function isAdmin(account: { role: string; status: string } | null) {
  return account?.role === "admin" && account.status === "active";
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : "";
  switch (code) {
    case "invalid_credentials":
      return "Email hoặc mật khẩu chưa đúng.";
    case "email_not_confirmed":
      return "Bạn cần xác nhận email trước khi đăng nhập.";
    case "user_already_exists":
    case "email_exists":
      return "Email này đã được đăng ký. Bạn có thể đăng nhập hoặc đặt lại mật khẩu.";
    case "weak_password":
      return "Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự và kết hợp chữ, số, ký tự đặc biệt.";
    case "same_password":
      return "Hãy chọn mật khẩu khác mật khẩu hiện tại.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Có quá nhiều yêu cầu. Vui lòng chờ một lúc rồi thử lại.";
    case "provider_disabled":
      return "Google chưa được bật. Bạn có thể đăng nhập bằng email hoặc tiếp tục xem ứng dụng.";
    case "validation_failed":
      return "Phương thức đăng nhập này chưa sẵn sàng. Vui lòng dùng email hoặc tiếp tục với tư cách khách.";
    case "signup_disabled":
      return "Hệ thống chưa mở đăng ký tài khoản mới.";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "Liên kết đã hết hạn hoặc đã được sử dụng. Vui lòng gửi yêu cầu mới.";
    default:
      return "Chưa thể kết nối để xác thực. Vui lòng thử lại sau.";
  }
}
